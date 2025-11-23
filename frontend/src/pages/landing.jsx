import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { usePublicClient } from 'wagmi';
import { useBountiesContext } from '../contexts/BountiesContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import Username from '../components/Username';
import { formatEther, formatUnits } from 'viem';
import { fetchTextData } from '../utils/dservice-upload';
import { parseMarkdownWithFrontmatter } from '../utils/markdown';
import { useChainId } from '../hooks/useChainId';
import { getTokenByAddress } from '../config/tokens';

const Landing = () => {
  const navigate = useNavigate();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { bounties, isLoading, error } = useBountiesContext();
  const [descriptionTitles, setDescriptionTitles] = useState({});

  const formatAmount = (amount, tokenAddr) => {
    if (tokenAddr === '0x0000000000000000000000000000000000000000' || !tokenAddr) {
      return `${formatEther(BigInt(amount))} ETH`;
    }
    
    // Look up token by address
    const token = getTokenByAddress(tokenAddr, chainId);
    if (token) {
      const formattedAmount = formatUnits(BigInt(amount), token.decimals);
      return `${formattedAmount} ${token.symbol}`;
    }
    
    // Fallback if token not found in config
    return `${amount} tokens`;
  };

  // Fetch description titles from dservice (only titles, not full descriptions)
  useEffect(() => {
    if (!bounties || bounties.length === 0 || !publicClient) return;

    const fetchTitles = async () => {
      const startTime = performance.now();
      
      // Fetch all titles in parallel
      const fetchPromises = bounties.map(async (bounty) => {
        if (!bounty.data || bounty.data === '0x0000000000000000000000000000000000000000000000000000000000000000') {
          return { tokenId: bounty.tokenId, title: null };
        }
        try {
          const fetchStart = performance.now();
          const text = await fetchTextData(bounty.data, publicClient);
          const fetchTime = performance.now() - fetchStart;
          if (fetchTime > 500) {
            console.log(`[Landing] Slow title fetch for bounty ${bounty.tokenId}: ${fetchTime.toFixed(2)}ms`);
          }
          const { title } = parseMarkdownWithFrontmatter(text);
          return { tokenId: bounty.tokenId, title };
        } catch (err) {
          console.error(`Error fetching title for bounty ${bounty.tokenId}:`, err);
          return { tokenId: bounty.tokenId, title: null };
        }
      });

      const results = await Promise.all(fetchPromises);
      const titles = {};
      results.forEach(({ tokenId, title }) => {
        titles[tokenId] = title;
      });
      setDescriptionTitles(titles);
      
      const totalTime = performance.now() - startTime;
      console.log(`[Landing] Fetched ${bounties.length} titles in ${totalTime.toFixed(2)}ms (parallel)`);
    };

    fetchTitles();
  }, [bounties, publicClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <span className="text-5xl">💰</span>
              Simple Bounty
            </h1>
            <button
              onClick={() => navigate('/new')}
              className="btn btn-primary"
            >
              Create Bounty
            </button>
          </div>
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <span className="text-5xl">💰</span>
              Simple Bounty
            </h1>
            <button
              onClick={() => navigate('/new')}
              className="btn btn-primary"
            >
              Create Bounty
            </button>
          </div>
          <div className="alert alert-error">
            <span>Error loading bounties: {error.message}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <span className="text-5xl">💰</span>
            Simple Bounty
          </h1>
          <button
            onClick={() => navigate('/new')}
            className="btn btn-primary"
          >
            Create Bounty
          </button>
        </div>

        {bounties.length === 0 ? (
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body text-center">
              <h2 className="card-title justify-center text-2xl">No bounties yet</h2>
              <p className="text-base-content/70">Be the first to create a bounty!</p>
              <div className="card-actions justify-center mt-4">
                <button
                  onClick={() => navigate('/new')}
                  className="btn btn-primary"
                >
                  Create First Bounty
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bounties.map((bounty) => (
              <div
                key={bounty.tokenId}
                className="card bg-base-200 shadow-xl cursor-pointer hover:shadow-2xl transition-shadow"
                onClick={() => navigate(`/${bounty.tokenId}`)}
              >
                <div className="card-body">
                  <h2 className="card-title">
                    {descriptionTitles[bounty.tokenId] || `Bounty #${bounty.tokenId}`}
                    {bounty.fulfilled && (
                      <div className="badge badge-success">Fulfilled</div>
                    )}
                  </h2>
                  {descriptionTitles[bounty.tokenId] && (
                    <div className="text-xs text-base-content/50 mb-2">
                      Bounty #{bounty.tokenId}
                    </div>
                  )}
                  <div className="mt-4">
                    <div className="text-2xl font-bold text-primary">
                      {formatAmount(bounty.amount, bounty.tokenAddr)}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar address={bounty.creator} size="sm" />
                      <div className="text-sm text-base-content/60">
                        <Username address={bounty.creator} />
                      </div>
                    </div>
                  </div>
                  <div className="card-actions justify-end mt-4">
                    <button className="btn btn-sm btn-outline">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;

