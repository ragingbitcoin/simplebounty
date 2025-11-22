import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { useChainId } from './useChainId';
import { contracts } from '../config/contracts';
import { indexAllEvents, buildStateFromEvents } from '../utils/indexer';

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
      const events = [];
      
      // Collect all events from the indexer
      for await (const event of indexAllEvents(publicClient, contractAddress, chainId)) {
        events.push(event);
      }

      // Build state from events
      const state = buildStateFromEvents(events);
      
      setBounties(state.bounties);
      setClaims(state.claims);
    } catch (err) {
      console.error('Error fetching bounties:', err);
      setError(err);
    } finally {
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

