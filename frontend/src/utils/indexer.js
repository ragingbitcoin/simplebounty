import { createPublicClient, http, parseAbiItem, decodeEventLog } from 'viem';
import { contracts } from '../config/contracts';

/**
 * ReverseIndexable Indexer
 * 
 * This utility implements the reverse indexing pattern from ReverseIndexable.sol.
 * It recursively follows the blockPointer chain to discover all contract events.
 * 
 * Pattern:
 * 1. Read blockPointer from contract state (most recent activity block)
 * 2. Query all events in that block
 * 3. Find BlockPointer event to get previous activity block
 * 4. Recursively follow chain backward until block 0
 */

/**
 * Get all events from a specific block for the contract
 */
async function getBlockEvents(publicClient, contractAddress, blockNumber, fromBlock = 0) {
  if (blockNumber < fromBlock) {
    return [];
  }

  try {
    const blockStart = performance.now();
    const logs = await publicClient.getLogs({
      address: contractAddress,
      event: parseAbiItem('event BlockPointer(uint256 previousBlock)'),
      fromBlock: BigInt(blockNumber),
      toBlock: BigInt(blockNumber),
    });

    // Get all SimpleBounty events from this block
    const allEvents = await publicClient.getLogs({
      address: contractAddress,
      fromBlock: BigInt(blockNumber),
      toBlock: BigInt(blockNumber),
    });
    const blockTime = performance.now() - blockStart;
    if (blockTime > 100) {
      console.log(`[Indexer] Slow block fetch: block ${blockNumber} took ${blockTime.toFixed(2)}ms (${allEvents.length} events)`);
    }

    return {
      blockNumber,
      blockPointerEvent: logs[0] || null,
      allEvents,
    };
  } catch (error) {
    console.error(`Error fetching events for block ${blockNumber}:`, error);
    return {
      blockNumber,
      blockPointerEvent: null,
      allEvents: [],
    };
  }
}

/**
 * Recursively index all events using the reverse indexing pattern
 * @param {Object} publicClient - Viem public client
 * @param {string} contractAddress - SimpleBounty contract address
 * @param {number} currentBlockPointer - Current block pointer from contract state
 * @param {number} fromBlock - Starting block (usually 0 or deployment block)
 * @param {Function} onEvent - Callback for each event discovered (yields events)
 * @returns {Promise<Array>} Array of all discovered events
 */
export async function* indexContractEvents(
  publicClient,
  contractAddress,
  currentBlockPointer,
  fromBlock = 0,
  onEvent = null
) {
  const visitedBlocks = new Set();
  let nextBlock = currentBlockPointer;

  while (nextBlock > fromBlock) {
    // Avoid infinite loops
    if (visitedBlocks.has(nextBlock)) {
      console.warn(`Circular reference detected at block ${nextBlock}`);
      break;
    }
    visitedBlocks.add(nextBlock);

    const blockData = await getBlockEvents(publicClient, contractAddress, nextBlock, fromBlock);
    
    // Yield all events from this block
    for (const event of blockData.allEvents) {
      if (onEvent) {
        yield onEvent(event, blockData.blockNumber);
      } else {
        yield { event, blockNumber: blockData.blockNumber };
      }
    }

    // Get next block from BlockPointer event
    if (blockData.blockPointerEvent) {
      const previousBlock = Number(blockData.blockPointerEvent.args.previousBlock);
      nextBlock = previousBlock;
    } else {
      // No BlockPointer event means we've reached the end
      break;
    }
  }
}

/**
 * Parse and categorize events into structured data
 */
export function parseEvent(event) {
  const { eventName, args } = event;

  switch (eventName) {
    case 'BountyCreated':
      return {
        type: 'BountyCreated',
        tokenId: Number(args.tokenId),
        data: args.data,
        tokenAddr: args.tokenAddr,
        amount: args.amount,
        creator: args.creator,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      };
    
    case 'BountyToppedUp':
      return {
        type: 'BountyToppedUp',
        tokenId: Number(args.tokenId),
        tokenAddr: args.tokenAddr,
        amount: args.amount,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      };
    
    case 'BountyUpdated':
      return {
        type: 'BountyUpdated',
        tokenId: Number(args.tokenId),
        newData: args.newData,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      };
    
    case 'ClaimAttempted':
      return {
        type: 'ClaimAttempted',
        tokenId: Number(args.tokenId),
        claimant: args.claimant,
        claimData: args.claimData,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      };
    
    case 'ClaimFulfilled':
      return {
        type: 'ClaimFulfilled',
        tokenId: Number(args.tokenId),
        winners: args.winners,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      };
    
    case 'TransferSingle':
      return {
        type: 'TransferSingle',
        operator: args.operator,
        from: args.from,
        to: args.to,
        id: Number(args.id),
        value: Number(args.value),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      };
    
    default:
      return {
        type: 'Unknown',
        eventName,
        args,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      };
  }
}

/**
 * Build complete state from indexed events
 * @param {Array} events - Array of parsed events
 * @returns {Object} Complete state with bounties and claims
 */
export function buildStateFromEvents(events) {
  const bounties = new Map();
  const claims = new Map(); // tokenId -> array of claims

  for (const event of events) {
    switch (event.type) {
      case 'BountyCreated':
        console.log(`[Indexer] Found new bounty: tokenId=${event.tokenId}, creator=${event.creator}, amount=${event.amount}, data=${event.data}, block=${event.blockNumber}`);
        bounties.set(event.tokenId, {
          tokenId: event.tokenId,
          data: event.data,
          tokenAddr: event.tokenAddr,
          amount: event.amount,
          creator: event.creator,
          createdAt: event.blockNumber,
          lastUpdated: event.blockNumber,
        });
        break;
      
      case 'BountyToppedUp':
        const toppedUp = bounties.get(event.tokenId);
        if (toppedUp) {
          console.log(`[Indexer] Bounty topped up: tokenId=${event.tokenId}, added=${event.amount}, new total=${(BigInt(toppedUp.amount) + BigInt(event.amount)).toString()}, block=${event.blockNumber}`);
          toppedUp.amount = (BigInt(toppedUp.amount) + BigInt(event.amount)).toString();
          toppedUp.lastUpdated = event.blockNumber;
        }
        break;
      
      case 'BountyUpdated':
        const updated = bounties.get(event.tokenId);
        if (updated) {
          console.log(`[Indexer] Bounty updated: tokenId=${event.tokenId}, newData=${event.newData}, block=${event.blockNumber}`);
          updated.data = event.newData;
          updated.lastUpdated = event.blockNumber;
        }
        break;
      
      case 'ClaimAttempted':
        if (!claims.has(event.tokenId)) {
          claims.set(event.tokenId, []);
        }
        claims.get(event.tokenId).push({
          claimant: event.claimant,
          claimData: event.claimData,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
        });
        break;
      
      case 'ClaimFulfilled':
        // Mark bounty as fulfilled
        const fulfilled = bounties.get(event.tokenId);
        if (fulfilled) {
          console.log(`[Indexer] Bounty fulfilled: tokenId=${event.tokenId}, winners=${event.winners.length}, block=${event.blockNumber}`);
          fulfilled.fulfilled = true;
          fulfilled.winners = event.winners;
          fulfilled.fulfilledAt = event.blockNumber;
        }
        break;
    }
  }

  return {
    bounties: Array.from(bounties.values()),
    claims: Object.fromEntries(claims),
  };
}

/**
 * Main indexing function that yields structured event data
 * @param {Object} publicClient - Viem public client
 * @param {string} contractAddress - SimpleBounty contract address
 * @param {number} chainId - Chain ID
 * @yields {Object} Parsed event data
 */
export async function* indexAllEvents(publicClient, contractAddress, chainId) {
  const startTime = performance.now();
  try {
    // Get current block pointer from contract
    const blockPointerStart = performance.now();
    const blockPointer = await publicClient.readContract({
      address: contractAddress,
      abi: contracts.abis.SimpleBounty,
      functionName: 'blockPointer',
    });
    console.log(`[Indexer] blockPointer read took ${(performance.now() - blockPointerStart).toFixed(2)}ms`);

    const currentBlockPointer = Number(blockPointer);

    if (currentBlockPointer === 0) {
      // No activity yet
      console.log(`[Indexer] No activity (blockPointer = 0), took ${(performance.now() - startTime).toFixed(2)}ms`);
      return;
    }

    console.log(`[Indexer] Starting indexing from block ${currentBlockPointer}`);
    let eventCount = 0;
    let lastBlockNumber = null;
    let lastBlockTime = performance.now();

    // Index all events recursively
    for await (const { event, blockNumber } of indexContractEvents(
      publicClient,
      contractAddress,
      currentBlockPointer
    )) {
      try {
        // Only decode events that have topics (indexed events)
        if (!event.topics || event.topics.length === 0) {
          continue;
        }

        // Decode event using ABI
        const decoded = decodeEventLog({
          abi: contracts.abis.SimpleBounty,
          data: event.data,
          topics: event.topics,
        });
        
        const parsed = parseEvent({
          eventName: decoded.eventName,
          args: decoded.args,
          blockNumber: Number(blockNumber),
          transactionHash: event.transactionHash,
        });
        eventCount++;
        
        // Log when we move to a new block
        if (lastBlockNumber !== null && blockNumber !== lastBlockNumber) {
          const blockTime = performance.now() - lastBlockTime;
          console.log(`[Indexer] Processed block ${lastBlockNumber} in ${blockTime.toFixed(2)}ms`);
          lastBlockTime = performance.now();
        }
        lastBlockNumber = blockNumber;
        
        yield parsed;
      } catch (err) {
        // Skip events that can't be decoded (might be from other contracts or unknown events)
        // This is expected for events we don't care about
      }
    }
    const totalTime = performance.now() - startTime;
    console.log(`[Indexer] Completed indexing: ${eventCount} events in ${totalTime.toFixed(2)}ms (avg ${(totalTime / Math.max(eventCount, 1)).toFixed(2)}ms/event)`);
  } catch (error) {
    console.error('Error indexing contract events:', error);
    throw error;
  }
}

