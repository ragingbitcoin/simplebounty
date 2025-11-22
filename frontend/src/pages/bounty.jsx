import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAccount } from 'wagmi';
import { useBounty } from '../hooks/useBounty';
import { useMakeClaim } from '../hooks/useMakeClaim';
import { useFulfillClaim } from '../hooks/useFulfillClaim';
import WalletInfo from '../components/WalletInfo';
import LoadingSpinner from '../components/LoadingSpinner';
import TransactionStatus from '../components/TransactionStatus';
import { formatEther } from 'viem';

const Bounty = () => {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { bounty, claims, isLoading, error } = useBounty(tokenId);
  const { makeClaim, hash: claimHash, isPending: isClaimPending, isSuccess: isClaimSuccess, error: claimError, reset: resetClaim } = useMakeClaim();
  const { fulfillClaim, hash: fulfillHash, isPending: isFulfillPending, isSuccess: isFulfillSuccess, error: fulfillError, reset: resetFulfill } = useFulfillClaim();

  const [claimData, setClaimData] = useState('');
  const [winners, setWinners] = useState('');
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [showFulfillForm, setShowFulfillForm] = useState(false);

  const formatAmount = (amount, tokenAddr) => {
    if (tokenAddr === '0x0000000000000000000000000000000000000000' || !tokenAddr) {
      return `${formatEther(BigInt(amount))} ETH`;
    }
    return `${amount} tokens`;
  };

  const formatData = (data) => {
    if (!data || data === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return 'No description';
    }
    try {
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

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleMakeClaim = async () => {
    if (!claimData.trim()) {
      alert('Please enter claim data');
      return;
    }
    try {
      await makeClaim(tokenId, claimData);
    } catch (err) {
      console.error('Error making claim:', err);
    }
  };

  const handleFulfillClaim = async () => {
    const winnerList = winners.split(',').map(w => w.trim()).filter(w => w.length > 0);
    if (winnerList.length === 0) {
      alert('Please enter at least one winner address');
      return;
    }
    try {
      await fulfillClaim(tokenId, winnerList);
    } catch (err) {
      console.error('Error fulfilling claim:', err);
    }
  };

  const isOwner = bounty && isConnected && address && bounty.creator?.toLowerCase() === address.toLowerCase();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-100 p-8">
        <div className="max-w-4xl mx-auto">
          <WalletInfo />
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (error || !bounty) {
    return (
      <div className="min-h-screen bg-base-100 p-8">
        <div className="max-w-4xl mx-auto">
          <WalletInfo />
          <div className="alert alert-error">
            <span>Bounty not found or error loading: {error?.message}</span>
          </div>
          <button onClick={() => navigate('/')} className="btn btn-outline mt-4">
            Back to Bounties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 p-8">
      <div className="max-w-4xl mx-auto">
        <WalletInfo />
        
        <button onClick={() => navigate('/')} className="btn btn-ghost btn-sm mb-4">
          ← Back to Bounties
        </button>

        <TransactionStatus
          status={isClaimPending ? 'pending' : isClaimSuccess ? 'success' : claimError ? 'error' : null}
          hash={claimHash}
          error={claimError}
          isConfirmed={isClaimSuccess}
          reset={resetClaim}
          onSuccess={() => {
            setShowClaimForm(false);
            setClaimData('');
          }}
        />

        <TransactionStatus
          status={isFulfillPending ? 'pending' : isFulfillSuccess ? 'success' : fulfillError ? 'error' : null}
          hash={fulfillHash}
          error={fulfillError}
          isConfirmed={isFulfillSuccess}
          reset={resetFulfill}
          onSuccess={() => {
            setShowFulfillForm(false);
            setWinners('');
          }}
        />

        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-4xl font-bold">Bounty #{bounty.tokenId}</h1>
              {bounty.fulfilled && (
                <div className="badge badge-success badge-lg">Fulfilled</div>
              )}
            </div>

            <div className="divider"></div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-base-content/80">{formatData(bounty.data)}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Reward</h3>
                <p className="text-2xl font-bold text-primary">
                  {formatAmount(bounty.amount, bounty.tokenAddr)}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Creator</h3>
                <p className="text-base-content/80 font-mono">{formatAddress(bounty.creator)}</p>
              </div>

              {bounty.fulfilled && bounty.winners && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Winners</h3>
                  <div className="space-y-1">
                    {bounty.winners.map((winner, idx) => (
                      <p key={idx} className="text-base-content/80 font-mono">{formatAddress(winner)}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isConnected && !bounty.fulfilled && (
              <div className="divider"></div>
            )}

            {isConnected && !bounty.fulfilled && (
              <div className="space-y-4">
                {!isOwner && (
                  <div>
                    <button
                      onClick={() => setShowClaimForm(!showClaimForm)}
                      className="btn btn-primary w-full"
                    >
                      {showClaimForm ? 'Cancel' : 'Make a Claim'}
                    </button>
                    {showClaimForm && (
                      <div className="mt-4 space-y-4">
                        <textarea
                          className="textarea textarea-bordered w-full"
                          placeholder="Enter your claim data..."
                          value={claimData}
                          onChange={(e) => setClaimData(e.target.value)}
                        />
                        <button
                          onClick={handleMakeClaim}
                          disabled={isClaimPending}
                          className="btn btn-primary w-full"
                        >
                          {isClaimPending ? 'Submitting...' : 'Submit Claim'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {isOwner && (
                  <div>
                    <button
                      onClick={() => setShowFulfillForm(!showFulfillForm)}
                      className="btn btn-success w-full"
                    >
                      {showFulfillForm ? 'Cancel' : 'Fulfill Claim'}
                    </button>
                    {showFulfillForm && (
                      <div className="mt-4 space-y-4">
                        <textarea
                          className="textarea textarea-bordered w-full"
                          placeholder="Enter winner addresses separated by commas (e.g., 0x123..., 0x456...)"
                          value={winners}
                          onChange={(e) => setWinners(e.target.value)}
                        />
                        <button
                          onClick={handleFulfillClaim}
                          disabled={isFulfillPending}
                          className="btn btn-success w-full"
                        >
                          {isFulfillPending ? 'Processing...' : 'Distribute Bounty'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!isConnected && !bounty.fulfilled && (
              <div className="alert alert-info">
                <span>Connect your wallet to make a claim</span>
              </div>
            )}
          </div>
        </div>

        {claims.length > 0 && (
          <div className="card bg-base-200 shadow-xl mt-6">
            <div className="card-body">
              <h2 className="text-2xl font-bold mb-4">Claims ({claims.length})</h2>
              <div className="space-y-4">
                {claims.map((claim, idx) => (
                  <div key={idx} className="border-b border-base-300 pb-4 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{formatAddress(claim.claimant)}</p>
                        <p className="text-sm text-base-content/60 mt-1">
                          {formatData(claim.claimData)}
                        </p>
                      </div>
                      <div className="text-sm text-base-content/60">
                        Block: {claim.blockNumber}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bounty;

