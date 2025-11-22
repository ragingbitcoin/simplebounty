import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useChainId } from './useChainId';
import { contracts } from '../config/contracts';
import { toBytes, pad } from 'viem';

/**
 * Hook to create a new bounty
 */
export function useCreateBounty() {
  const chainId = useChainId();
  const contractAddress = contracts.deployments[chainId]?.SimpleBounty;
  const [isCreating, setIsCreating] = useState(false);

  const { writeContract, data: hash, error, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createBountyWithETH = async (dataString, value) => {
    if (!contractAddress) {
      throw new Error('Contract address not configured');
    }

    setIsCreating(true);
    try {
      // Convert string to bytes32 (pad to 32 bytes)
      const dataBytes = toBytes(dataString);
      const data = pad(dataBytes, { size: 32 });

      await writeContract({
        address: contractAddress,
        abi: contracts.abis.SimpleBounty,
        functionName: 'new',
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

    setIsCreating(true);
    try {
      // Convert string to bytes32 (pad to 32 bytes)
      const dataBytes = toBytes(dataString);
      const data = pad(dataBytes, { size: 32 });

      await writeContract({
        address: contractAddress,
        abi: contracts.abis.SimpleBounty,
        functionName: 'new',
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

