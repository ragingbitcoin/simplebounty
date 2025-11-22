import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { useChainId } from './useChainId';
import { contracts } from '../config/contracts';
import { indexAllEvents } from '../utils/indexer';

/**
 * Hook to fetch all bounties using the ReverseIndexable pattern
 */
export function useBounties() {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [bounties, setBounties] = useState([]);
  const [claims, setClaims] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const contractAddress = contracts.deployments[chainId]?.SimpleBounty;

  const refreshBounties = useCallback(async () => {
    if (!publicClient || !contractAddress) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let hasReceivedUpdate = false;
      
      // Update state incrementally as blocks are processed
      for await (const state of indexAllEvents(publicClient, contractAddress, chainId)) {
        // Update state after each block is processed
        setBounties(state.bounties);
        setClaims(state.claims);
        
        // Set loading to false after first update so UI can show bounties as they load
        if (!hasReceivedUpdate) {
          setIsLoading(false);
          hasReceivedUpdate = true;
        }
      }
      
      // Ensure loading is false when iteration completes
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching bounties:', err);
      setError(err);
      setIsLoading(false);
    }
  }, [publicClient, contractAddress, chainId]);

  useEffect(() => {
    refreshBounties();
  }, [refreshBounties]);

  return {
    bounties,
    claims,
    isLoading,
    error,
    refresh: refreshBounties,
  };
}

