import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAccount, usePublicClient } from 'wagmi';
import { useBounty } from '../hooks/useBounty';
import { useMakeClaim } from '../hooks/useMakeClaim';
import { useFulfillClaim } from '../hooks/useFulfillClaim';
import WalletInfo from '../components/WalletInfo';
import LoadingSpinner from '../components/LoadingSpinner';
import TransactionStatus from '../components/TransactionStatus';
import { formatEther } from 'viem';
import { fetchTextData } from '../utils/dservice-upload';

const Bounty = () => {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { bounty, claims, isLoading, error } = useBounty(tokenId);
  const { makeClaim, hash: claimHash, isPending: isClaimPending, isConfirming: isClaimConfirming, isSuccess: isClaimSuccess, error: claimError, reset: resetClaim } = useMakeClaim();
  const { fulfillClaim, hash: fulfillHash, isPending: isFulfillPending, isConfirming: isFulfillConfirming, isSuccess: isFulfillSuccess, error: fulfillError, reset: resetFulfill } = useFulfillClaim();

  const [claimData, setClaimData] = useState('');
  const [selectedClaims, setSelectedClaims] = useState(new Set());
  const [descriptionText, setDescriptionText] = useState(null);
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const [descriptionError, setDescriptionError] = useState(null);
  const [claimTexts, setClaimTexts] = useState({});

  const formatAmount = (amount, tokenAddr) => {
    if (tokenAddr === '0x0000000000000000000000000000000000000000' || !tokenAddr) {
      return `${formatEther(BigInt(amount))} ETH`;
    }
    return `${amount} tokens`;
  };

  // Fetch description text from dservice
  useEffect(() => {
    if (!bounty?.data || !publicClient) return;
    
    const hash = bounty.data;
    if (!hash || hash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      setDescriptionText('No description');
      return;
    }

    setDescriptionLoading(true);
    setDescriptionError(null);
    
    fetchTextData(hash, publicClient)
      .then(text => {
        setDescriptionText(text);
        setDescriptionLoading(false);
      })
      .catch(err => {
        console.error('Error fetching description:', err);
        setDescriptionError(err.message);
        setDescriptionLoading(false);
        // Fallback to showing hash
        setDescriptionText(`Error loading description: ${err.message}`);
      });
  }, [bounty?.data, publicClient]);

  // Fetch claim texts from dservice
  useEffect(() => {
    if (!claims || claims.length === 0 || !publicClient) return;

    const fetchClaimTexts = async () => {
      const texts = {};
      for (const claim of claims) {
        if (!claim.claimData || claim.claimData === '0x0000000000000000000000000000000000000000000000000000000000000000') {
          texts[claim.transactionHash] = 'No claim data';
          continue;
        }
        try {
          const text = await fetchTextData(claim.claimData, publicClient);
          texts[claim.transactionHash] = text;
        } catch (err) {
          console.error('Error fetching claim data:', err);
          texts[claim.transactionHash] = `Error loading claim: ${err.message}`;
        }
      }
      setClaimTexts(texts);
    };

    fetchClaimTexts();
  }, [claims, publicClient]);

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
    if (selectedClaims.size === 0) {
      alert('Please select at least one claim to fulfill');
      return;
    }
    // Get the claimant addresses for the selected transaction hashes
    const selectedTransactionHashes = Array.from(selectedClaims);
    const winnerList = claims
      .filter(claim => selectedTransactionHashes.includes(claim.transactionHash))
      .map(claim => claim.claimant);
    try {
      await fulfillClaim(tokenId, winnerList);
      setSelectedClaims(new Set());
    } catch (err) {
      console.error('Error fulfilling claim:', err);
    }
  };

  const toggleClaimSelection = (transactionHash) => {
    const newSelected = new Set(selectedClaims);
    if (newSelected.has(transactionHash)) {
      newSelected.delete(transactionHash);
    } else {
      newSelected.add(transactionHash);
    }
    setSelectedClaims(newSelected);
  };

  const isOwner = bounty && isConnected && address && bounty.creator?.toLowerCase() === address.toLowerCase();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-100 p-4 sm:p-8">
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
      <div className="min-h-screen bg-base-100 p-4 sm:p-8">
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
    <div className="min-h-screen bg-base-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <WalletInfo />
        
        <button onClick={() => navigate('/')} className="btn btn-ghost btn-sm mb-4">
          ← Back to Bounties
        </button>

        <TransactionStatus
          status={isClaimPending || isClaimConfirming ? 'pending' : isClaimSuccess ? 'success' : claimError ? 'error' : null}
          hash={claimHash}
          error={claimError}
          isConfirmed={isClaimSuccess}
          reset={resetClaim}
          onSuccess={() => {
            setClaimData('');
          }}
        />

        <TransactionStatus
          status={isFulfillPending || isFulfillConfirming ? 'pending' : isFulfillSuccess ? 'success' : fulfillError ? 'error' : null}
          hash={fulfillHash}
          error={fulfillError}
          isConfirmed={isFulfillSuccess}
          reset={resetFulfill}
          onSuccess={() => {
            setSelectedClaims(new Set());
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
                {descriptionLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-sm"></span>
                    <span className="text-base-content/60">Loading description...</span>
                  </div>
                ) : descriptionError ? (
                  <p className="text-base-content/80 text-error">{descriptionError}</p>
                ) : (
                  <p className="text-base-content/80 whitespace-pre-wrap">{descriptionText || 'Loading...'}</p>
                )}
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

          </div>
        </div>

        {claims.length > 0 && (
          <div className="card bg-base-200 shadow-xl mt-6">
            <div className="card-body">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
                <h2 className="text-xl sm:text-2xl font-bold">Claims ({claims.length})</h2>
                {isOwner && !bounty.fulfilled && selectedClaims.size > 0 && (
                  <button
                    onClick={handleFulfillClaim}
                    disabled={isFulfillPending}
                    className="btn btn-success btn-sm w-full sm:w-auto"
                  >
                    {isFulfillPending ? 'Processing...' : `Fulfill ${selectedClaims.size} Selected`}
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {claims.map((claim, idx) => {
                  const isSelected = selectedClaims.has(claim.transactionHash);
                  return (
                    <div
                      key={idx}
                      className={`p-4 border rounded-md ${
                        isOwner && !bounty.fulfilled
                          ? isSelected
                            ? 'border-primary bg-primary/10 cursor-pointer'
                            : 'border-base-300 cursor-pointer hover:border-base-content/20'
                          : 'border-base-300'
                      }`}
                      onClick={() => isOwner && !bounty.fulfilled && toggleClaimSelection(claim.transactionHash)}
                    >
                      <div className="flex items-start gap-3">
                        {isOwner && !bounty.fulfilled && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleClaimSelection(claim.transactionHash)}
                            onClick={(e) => e.stopPropagation()}
                            className="checkbox checkbox-primary mt-1"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold font-mono">{formatAddress(claim.claimant)}</p>
                            <span className="text-xs text-base-content/60">Block: {claim.blockNumber}</span>
                          </div>
                          <p className="text-sm text-base-content/80 whitespace-pre-wrap">
                            {claimTexts[claim.transactionHash] || 'Loading claim data...'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {isOwner && !bounty.fulfilled && claims.length > 0 && selectedClaims.size === 0 && (
                <div className="mt-4 text-sm text-base-content/60 text-center">
                  Select claims above to fulfill them
                </div>
              )}
            </div>
          </div>
        )}

        {/* Make a Claim Form */}
        {!bounty.fulfilled && (
          <div className="card bg-base-200 shadow-xl mt-6">
            <div className="card-body">
              <h3 className="text-lg font-semibold mb-4">Make a Claim</h3>
              <div className="space-y-3">
                <textarea
                  className="textarea textarea-bordered w-full min-h-[100px] resize-none"
                  placeholder="Enter your claim description..."
                  value={claimData}
                  onChange={(e) => setClaimData(e.target.value)}
                  rows={4}
                />
                <button
                  onClick={handleMakeClaim}
                  disabled={!isConnected || isClaimPending || !claimData.trim()}
                  className="btn btn-primary w-full"
                >
                  {isClaimPending ? 'Submitting...' : 'Submit Claim'}
                </button>
                {!isConnected && (
                  <div className="text-sm text-base-content/60 text-center">
                    Connect your wallet to make a claim
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bounty;

