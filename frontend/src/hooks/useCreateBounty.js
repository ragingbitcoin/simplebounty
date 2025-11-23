import { useState, useEffect, useMemo } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient, useWalletClient, useAccount } from 'wagmi';
import { useChainId } from './useChainId';
import { contracts } from '../config/contracts';
import { uploadTextData, cidToBytes32 } from '../utils/dservice-upload';
import { parseUnits } from 'viem';
import { eip5792Actions } from 'viem/experimental';

/**
 * Hook to create a new bounty.
 * Uploads the description to dservice and stores the CID hash on-chain.
 */
export function useCreateBounty() {
  const chainId = useChainId();
  const contractAddress = contracts.deployments[chainId]?.SimpleBounty;
  const publicClient = usePublicClient();
  const { data: baseWalletClient } = useWalletClient();
  const { address } = useAccount();
  const [isCreating, setIsCreating] = useState(false);
  const [erc20Hash, setErc20Hash] = useState(null);
  const [erc20Error, setErc20Error] = useState(null);

  // Extend wallet client with EIP-5792 actions to enable sendCalls
  const walletClient = useMemo(() => {
    if (!baseWalletClient) return null;
    return baseWalletClient.extend(eip5792Actions());
  }, [baseWalletClient]);

  const { writeContract, data: hash, error, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: hash || erc20Hash,
  });

  // ERC20 ABI for approval and allowance
  const erc20Abi = [
    {
      name: 'approve',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'spender', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [{ name: '', type: 'bool' }],
    },
    {
      name: 'allowance',
      type: 'function',
      stateMutability: 'view',
      inputs: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
      ],
      outputs: [{ name: '', type: 'uint256' }],
    },
  ];

  const createBountyWithETH = async (dataString, value) => {
    if (!contractAddress) {
      throw new Error('Contract address not configured');
    }
    if (!publicClient) {
      throw new Error('Public client not available');
    }

    setIsCreating(true);
    try {
      // Upload description to dservice and get CID
      const cid = await uploadTextData(dataString, publicClient);
      // Convert CID to bytes32 for on-chain storage
      const data = cidToBytes32(cid);

      await writeContract({
        address: contractAddress,
        abi: contracts.abis.SimpleBounty,
        functionName: 'create',
        args: [data],
        value: BigInt(value),
      });
    } catch (err) {
      console.error('Error creating bounty:', err);
      setIsCreating(false);
      throw err;
    }
  };

  const createBountyWithERC20 = async (dataString, tokenAddr, amount, decimals) => {
    if (!contractAddress) {
      throw new Error('Contract address not configured');
    }
    if (!publicClient) {
      throw new Error('Public client not available');
    }
    if (!walletClient) {
      throw new Error('Wallet client not available');
    }
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsCreating(true);
    setErc20Error(null);
    setErc20Hash(null);
    
    try {
      // Upload description to dservice and get CID
      const cid = await uploadTextData(dataString, publicClient);
      // Convert CID to bytes32 for on-chain storage
      const data = cidToBytes32(cid);

      // Convert amount string to BigInt using correct decimals
      const amountBigInt = parseUnits(amount, decimals);

      // Check current allowance
      const currentAllowance = await publicClient.readContract({
        address: tokenAddr,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, contractAddress],
      });

      // Prepare calls array
      const calls = [];

      // Add approval call if needed
      if (currentAllowance < amountBigInt) {
        calls.push({
          to: tokenAddr,
          abi: erc20Abi,
          functionName: 'approve',
          args: [contractAddress, amountBigInt], // Approve exactly the amount needed
        });
      }

      // Add create bounty call
      calls.push({
        to: contractAddress,
        abi: contracts.abis.SimpleBounty,
        functionName: 'create',
        args: [data, tokenAddr, amountBigInt],
      });

      // Send batched calls with fallback flag
      const result = await walletClient.sendCalls({
        calls,
        chain: walletClient.chain,
        experimental_fallback: true, // Enable fallback for wallets not supporting EIP-5792
      });

      // sendCalls returns { id } for EIP-5792 batches
      // With experimental_fallback: true, if wallet doesn't support EIP-5792,
      // it executes sequentially and returns the last transaction hash
      let transactionHash;
      
      if (typeof result === 'string') {
        // Fallback mode: returns the last transaction hash directly
        transactionHash = result;
      } else if (result && typeof result.id === 'string') {
        // EIP-5792 mode: returns batch ID
        // Wait for the batch to complete and get transaction hashes
        try {
          const batchResult = await walletClient.waitForCallsStatus({ id: result.id });
          // Extract the last transaction hash from the batch
          // waitForCallsStatus returns { status, receipts }
          if (batchResult?.receipts && batchResult.receipts.length > 0) {
            // Get the last receipt's transaction hash
            transactionHash = batchResult.receipts[batchResult.receipts.length - 1].transactionHash;
          } else {
            throw new Error('No receipts in batch result');
          }
        } catch (err) {
          // If waitForCallsStatus fails, throw the error
          console.error('waitForCallsStatus failed:', err);
          throw new Error(`Failed to wait for batch calls: ${err.message}`);
        }
      } else {
        throw new Error(`Unexpected result from sendCalls: ${JSON.stringify(result)}`);
      }
      
      // Ensure transactionHash is a string
      if (typeof transactionHash !== 'string') {
        throw new Error(`Invalid transaction hash: ${transactionHash}`);
      }
      
      setErc20Hash(transactionHash);

      // Wait for transaction receipt (already confirmed by waitForCallsStatus, but ensure it's in the chain)
      await publicClient.waitForTransactionReceipt({ hash: transactionHash });
      
      // Transaction completed successfully
      setIsCreating(false);
    } catch (err) {
      console.error('Error creating bounty:', err);
      setErc20Error(err);
      setIsCreating(false);
      throw err;
    }
  };

  // Reset creating state when transaction completes
  useEffect(() => {
    if (isSuccess || error || erc20Error) {
      setIsCreating(false);
    }
  }, [isSuccess, error, erc20Error]);

  // Reset function that also clears ERC20 state
  const resetAll = () => {
    reset();
    setErc20Hash(null);
    setErc20Error(null);
  };

  return {
    createBountyWithETH,
    createBountyWithERC20,
    hash: hash || erc20Hash,
    isPending: isPending || isCreating,
    isConfirming,
    isSuccess,
    error: error || erc20Error,
    reset: resetAll,
  };
}

