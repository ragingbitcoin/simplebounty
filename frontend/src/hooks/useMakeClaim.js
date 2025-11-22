import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useChainId } from './useChainId';
import { contracts } from '../config/contracts';
import { toBytes, pad } from 'viem';

/**
 * Hook to make a claim on a bounty
 */
export function useMakeClaim() {
  const chainId = useChainId();
  const contractAddress = contracts.deployments[chainId]?.SimpleBounty;

  const { writeContract, data: hash, error, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const makeClaim = async (tokenId, claimDataString) => {
    if (!contractAddress) {
      throw new Error('Contract address not configured');
    }

    // Convert string to bytes32 (pad to 32 bytes)
    const dataBytes = toBytes(claimDataString);
    const claimData = pad(dataBytes, { size: 32 });

    await writeContract({
      address: contractAddress,
      abi: contracts.abis.SimpleBounty,
      functionName: 'makeClaim',
      args: [BigInt(tokenId), claimData],
    });
  };

  return {
    makeClaim,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

