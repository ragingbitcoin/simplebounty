import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useChainId } from './useChainId';
import { contracts } from '../config/contracts';

/**
 * Hook to fulfill a claim (distribute bounty to a winner)
 */
export function useFulfillClaim() {
  const chainId = useChainId();
  const contractAddress = contracts.deployments[chainId]?.SimpleBounty;

  const { writeContract, data: hash, error, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const fulfillClaim = async (tokenId, winner, winningClaim) => {
    if (!contractAddress) {
      throw new Error('Contract address not configured');
    }

    if (!winner || typeof winner !== 'string') {
      throw new Error('Must provide a winner address');
    }

    if (!winningClaim || typeof winningClaim !== 'string') {
      throw new Error('Must provide a winningClaim (bytes32 hash)');
    }

    await writeContract({
      address: contractAddress,
      abi: contracts.abis.SimpleBounty,
      functionName: 'fulfillClaim',
      args: [BigInt(tokenId), winner, winningClaim],
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

