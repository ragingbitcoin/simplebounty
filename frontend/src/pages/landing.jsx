import React from 'react';
import { useNavigate } from 'react-router';
import { useBounties } from '../hooks/useBounties';
import WalletInfo from '../components/WalletInfo';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatEther } from 'viem';

const Landing = () => {
  const navigate = useNavigate();
  const { bounties, isLoading, error } = useBounties();

  const formatAmount = (amount, tokenAddr) => {
    if (tokenAddr === '0x0000000000000000000000000000000000000000' || !tokenAddr) {
      return `${formatEther(BigInt(amount))} ETH`;
    }
    return `${amount} tokens`;
  };

  const formatData = (data) => {
    // Convert bytes32 to readable string (remove null bytes)
    if (!data || data === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return 'No description';
    }
    try {
      // Try to decode as UTF-8 string
      const hex = data.slice(2);
      let str = '';
      for (let i = 0; i < hex.length; i += 2) {
        const byte = parseInt(hex.substr(i, 2), 16);
        if (byte === 0) break;
        str += String.fromCharCode(byte);
      }
      return str || 'No description';
    } catch {
      return data.slice(0, 10) + '...';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-100 p-8">
        <div className="max-w-6xl mx-auto">
          <WalletInfo />
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
          <WalletInfo />
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
        <WalletInfo />
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Simple Bounty</h1>
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
                    Bounty #{bounty.tokenId}
                    {bounty.fulfilled && (
                      <div className="badge badge-success">Fulfilled</div>
                    )}
                  </h2>
                  <p className="text-base-content/70 line-clamp-2">
                    {formatData(bounty.data)}
                  </p>
                  <div className="mt-4">
                    <div className="text-2xl font-bold text-primary">
                      {formatAmount(bounty.amount, bounty.tokenAddr)}
                    </div>
                    <div className="text-sm text-base-content/60 mt-1">
                      Created by: {bounty.creator?.slice(0, 6)}...{bounty.creator?.slice(-4)}
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

