import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { useChainId } from './useChainId';
import { contracts } from '../config/contracts';
import { uploadTextData, cidToBytes32 } from '../utils/dservice-upload';

/**
 * Hook to update a bounty's description.
 * Uploads the new description to dservice and stores the CID hash on-chain.
 */
export function useUpdateBounty() {
  const chainId = useChainId();
  const contractAddress = contracts.deployments[chainId]?.SimpleBounty;
  const publicClient = usePublicClient();

  const { writeContract, data: hash, error, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const updateBounty = async (tokenId, dataString) => {
    if (!contractAddress) {
      throw new Error('Contract address not configured');
    }
    if (!publicClient) {
      throw new Error('Public client not available');
    }

    // Upload new description to dservice and get CID
    const cid = await uploadTextData(dataString, publicClient);
    // Convert CID to bytes32 for on-chain storage
    const data = cidToBytes32(cid);

    await writeContract({
      address: contractAddress,
      abi: contracts.abis.SimpleBounty,
      functionName: 'update',
      args: [BigInt(tokenId), data],
    });
  };

  return {
    updateBounty,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

