import { useReadContract } from 'wagmi';
import { useChainId } from './useChainId';
import { contracts } from '../config/contracts';
import { useBounties } from './useBounties';

/**
 * Hook to get a specific bounty by tokenId
 */
export function useBounty(tokenId) {
  const chainId = useChainId();
  const contractAddress = contracts.deployments[chainId]?.SimpleBounty;
  const { bounties, claims } = useBounties();

  // Try to get from indexed data first
  const indexedBounty = bounties.find(b => b.tokenId === Number(tokenId));
  const bountyClaims = claims[tokenId] || [];

  // Also read from contract as fallback/verification
  const { data: contractBounty, isLoading, error } = useReadContract({
    address: contractAddress,
    abi: contracts.abis.SimpleBounty,
    functionName: 'getBounty',
    args: [BigInt(tokenId)],
    query: {
      enabled: !!contractAddress && tokenId !== undefined && tokenId !== null,
    },
  });

  // Merge indexed data with contract data
  const bounty = indexedBounty || (contractBounty ? {
    tokenId: Number(tokenId),
    data: contractBounty[0],
    tokenAddr: contractBounty[1],
    amount: contractBounty[2].toString(),
  } : null);

  return {
    bounty,
    claims: bountyClaims,
    isLoading,
    error,
  };
}

