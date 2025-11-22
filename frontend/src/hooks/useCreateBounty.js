import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { useChainId } from './useChainId';
import { contracts } from '../config/contracts';
import { uploadTextData, cidToBytes32 } from '../utils/dservice-upload';

/**
 * Hook to create a new bounty.
 * Uploads the description to dservice and stores the CID hash on-chain.
 */
export function useCreateBounty() {
  const chainId = useChainId();
  const contractAddress = contracts.deployments[chainId]?.SimpleBounty;
  const publicClient = usePublicClient();
  const [isCreating, setIsCreating] = useState(false);

  const { writeContract, data: hash, error, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

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

  const createBountyWithERC20 = async (dataString, tokenAddr, amount) => {
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
        args: [data, tokenAddr, BigInt(amount)],
      });
    } catch (err) {
      console.error('Error creating bounty:', err);
      setIsCreating(false);
      throw err;
    }
  };

  // Reset creating state when transaction completes
  if (isSuccess || error) {
    setIsCreating(false);
  }

  return {
    createBountyWithETH,
    createBountyWithERC20,
    hash,
    isPending: isPending || isCreating,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

