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
  // The contract's getBounty function reverts with "Bounty does not exist" when the bounty doesn't exist
  const isBountyNotFound = error && (
    error.message?.includes('Bounty does not exist') ||
    error.shortMessage?.includes('Bounty does not exist') ||
    error.cause?.message?.includes('Bounty does not exist') ||
    error.cause?.data?.includes('Bounty does not exist') ||
    // Also check for execution reverted errors that might contain the message
    (error.shortMessage?.includes('execution reverted') && 
     (error.message?.includes('Bounty') || error.cause?.message?.includes('Bounty')))
  );

  // If we have indexed data, use it (even if contract call is still loading)
  // Otherwise, use contract data if available
  const bounty = indexedBounty || (contractBounty ? {
    tokenId: Number(tokenId),
    data: contractBounty[0],
    tokenAddr: contractBounty[1],
    amount: contractBounty[2].toString(),
  } : null);

  // Determine loading state:
  // - If we have indexed data, we don't need to wait for contract call
  // - If contract call failed with "not found" error, stop loading
  // - Otherwise, use the contract call's loading state
  const finalIsLoading = indexedBounty ? false : (isBountyNotFound ? false : isLoading);

  return {
    bounty: isBountyNotFound ? null : bounty,
    claims: bountyClaims,
    isLoading: finalIsLoading,
    // Only clear error if it's specifically a "not found" error
    // Keep other errors (network issues, etc.) so they can be displayed
    error: isBountyNotFound ? null : error,
  };
}

