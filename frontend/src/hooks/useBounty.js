import { useReadContract } from 'wagmi';
import { useChainId } from './useChainId';
import { contracts } from '../config/contracts';
import { useBountiesContext } from '../contexts/BountiesContext';

/**
 * Hook to get a specific bounty by tokenId
 */
export function useBounty(tokenId) {
  const chainId = useChainId();
  const contractAddress = contracts.deployments[chainId]?.SimpleBounty;
  const { bounties, claims } = useBountiesContext();

  // Try to get from indexed data first
  const indexedBounty = bounties.find(b => b.tokenId === Number(tokenId));
  const bountyClaims = claims[tokenId] || [];

  // Also read from contract as fallback/verification
  // Note: getBounty now works for fulfilled bounties too (amount is not set to 0)
  const { data: contractBounty, isLoading, error } = useReadContract({
    address: contractAddress,
    abi: contracts.abis.SimpleBounty,
    functionName: 'getBounty',
    args: [BigInt(tokenId)],
    query: {
      enabled: !!contractAddress && tokenId !== undefined && tokenId !== null,
    },
  });

  // Check if error indicates bounty doesn't exist
  const isBountyNotFound = error && (
    error.message?.includes('Bounty does not exist') ||
    error.shortMessage?.includes('Bounty does not exist') ||
    error.cause?.message?.includes('Bounty does not exist') ||
    error.cause?.data?.includes('Bounty does not exist') ||
    // Also check for execution reverted errors that might contain the message
    (error.shortMessage?.includes('execution reverted') && 
     (error.message?.includes('Bounty') || error.cause?.message?.includes('Bounty')))
  );

  // If we have indexed data, use it (even if contract call is still loading or failed)
  // Otherwise, use contract data if available
  const bounty = indexedBounty || (contractBounty ? {
    tokenId: Number(tokenId),
    data: contractBounty[0],
    tokenAddr: contractBounty[1],
    amount: contractBounty[2].toString(),
    winningClaim: contractBounty[3],
    // Determine fulfilled status from winningClaim
    fulfilled: contractBounty[3] && contractBounty[3] !== '0x0000000000000000000000000000000000000000000000000000000000000000',
  } : null);

  // Merge contract data with indexed data if both exist
  const finalBounty = indexedBounty && contractBounty ? {
    ...indexedBounty,
    // Update with contract data (winningClaim is authoritative)
    winningClaim: contractBounty[3],
    fulfilled: contractBounty[3] && contractBounty[3] !== '0x0000000000000000000000000000000000000000000000000000000000000000',
    amount: contractBounty[2].toString(), // Use current amount from contract
  } : (indexedBounty || bounty);

  // Determine loading state:
  // - If we have indexed data, we don't need to wait for contract call
  // - If contract call failed with "not found" error and we have indexed data, stop loading
  // - If contract call failed with "not found" error and we DON'T have indexed data, stop loading (bounty doesn't exist)
  // - Otherwise, use the contract call's loading state
  const finalIsLoading = indexedBounty ? false : (isBountyNotFound ? false : isLoading);

  return {
    bounty: finalBounty,
    claims: bountyClaims,
    isLoading: finalIsLoading,
    // Only clear error if we have indexed data
    // OR if it's specifically a "not found" error and we don't have indexed data
    // Keep other errors (network issues, etc.) so they can be displayed
    error: (indexedBounty || isBountyNotFound) ? null : error,
  };
}

