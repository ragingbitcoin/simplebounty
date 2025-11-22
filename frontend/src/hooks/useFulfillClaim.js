import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useChainId } from './useChainId';
import { contracts } from '../config/contracts';

/**
 * Hook to fulfill a claim (distribute bounty to winners)
 */
export function useFulfillClaim() {
  const chainId = useChainId();
  const contractAddress = contracts.deployments[chainId]?.SimpleBounty;

  const { writeContract, data: hash, error, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const fulfillClaim = async (tokenId, winners) => {
    if (!contractAddress) {
      throw new Error('Contract address not configured');
    }

    if (!Array.isArray(winners) || winners.length === 0) {
      throw new Error('Must provide at least one winner address');
    }

    await writeContract({
      address: contractAddress,
      abi: contracts.abis.SimpleBounty,
      functionName: 'fulfillClaim',
      args: [BigInt(tokenId), winners],
    });
  };

  return {
    fulfillClaim,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

