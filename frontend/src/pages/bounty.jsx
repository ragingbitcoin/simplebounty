import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAccount, usePublicClient, useEnsName } from 'wagmi';
import { useBounty } from '../hooks/useBounty';
import { useMakeClaim } from '../hooks/useMakeClaim';
import { useFulfillClaim } from '../hooks/useFulfillClaim';
import WalletInfo from '../components/WalletInfo';
import LoadingSpinner from '../components/LoadingSpinner';
import TransactionStatus from '../components/TransactionStatus';
import AddressDisplay from '../components/AddressDisplay';
import Avatar from '../components/Avatar';
import Username from '../components/Username';
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

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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
      <div className="max-w-6xl mx-auto">
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

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-semibold">
              Bounty #{bounty.tokenId}
              {bounty.fulfilled && (
                <span className="ml-3 badge badge-success">Fulfilled</span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-base-content/60">
            <span className="font-semibold text-primary text-lg">
              {formatAmount(bounty.amount, bounty.tokenAddr)}
            </span>
            {bounty.fulfilled && bounty.winners && bounty.winners.length > 0 && (
              <span>• {bounty.winners.length} winner{bounty.winners.length > 1 ? 's' : ''}</span>
            )}
            <span>• {claims.length} claim{claims.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Main Issue/Description - GitHub style */}
        <div className="border border-base-300 rounded-lg bg-base-100">
          <div className="flex gap-4 p-4">
            <Avatar address={bounty.creator} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Username address={bounty.creator} />
                <span className="text-sm text-base-content/60">opened this bounty</span>
              </div>
              <div className="prose prose-sm max-w-none">
                {descriptionLoading ? (
                  <div className="flex items-center gap-2 py-4">
                    <span className="loading loading-spinner loading-sm"></span>
                    <span className="text-base-content/60">Loading description...</span>
                  </div>
                ) : descriptionError ? (
                  <p className="text-error">{descriptionError}</p>
                ) : (
                  <div className="text-base-content whitespace-pre-wrap">
                    {descriptionText || 'Loading...'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Claims/Comments - GitHub style */}
        {claims.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {claims.length} {claims.length === 1 ? 'Claim' : 'Claims'}
              </h2>
              {isOwner && !bounty.fulfilled && selectedClaims.size > 0 && (
                <button
                  onClick={handleFulfillClaim}
                  disabled={isFulfillPending}
                  className="btn btn-success btn-sm"
                >
                  {isFulfillPending ? 'Processing...' : `Fulfill ${selectedClaims.size} Selected`}
                </button>
              )}
            </div>
            <div className="border border-base-300 rounded-lg bg-base-100 divide-y divide-base-300">
              {claims.map((claim, idx) => {
                const isSelected = selectedClaims.has(claim.transactionHash);
                return (
                  <div
                    key={idx}
                    className={`${
                      isOwner && !bounty.fulfilled
                        ? isSelected
                          ? 'bg-primary/5 border-l-4 border-l-primary'
                          : 'hover:bg-base-200/50 cursor-pointer'
                        : ''
                    }`}
                    onClick={() => isOwner && !bounty.fulfilled && toggleClaimSelection(claim.transactionHash)}
                  >
                    <div className="flex gap-4 p-4">
                      {isOwner && !bounty.fulfilled && (
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleClaimSelection(claim.transactionHash)}
                            onClick={(e) => e.stopPropagation()}
                            className="checkbox checkbox-primary checkbox-sm"
                          />
                        </div>
                      )}
                      <Avatar address={claim.claimant} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Username address={claim.claimant} />
                          <span className="text-sm text-base-content/60">
                            commented
                          </span>
                          <span className="text-sm text-base-content/40">
                            • Block {claim.blockNumber}
                          </span>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <div className="text-base-content whitespace-pre-wrap">
                            {claimTexts[claim.transactionHash] || (
                              <span className="text-base-content/60 italic">Loading claim data...</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {isOwner && !bounty.fulfilled && claims.length > 0 && selectedClaims.size === 0 && (
              <div className="mt-4 text-sm text-base-content/60 text-center border-t border-base-300 pt-4">
                Select claims above to fulfill them
              </div>
            )}
          </div>
        )}

        {/* Make a Claim Form - GitHub style */}
        {!bounty.fulfilled && (
          <div className="border border-base-300 rounded-lg bg-base-100 mt-6">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">Add a claim</h3>
              <div className="space-y-3">
                <textarea
                  className="textarea textarea-bordered w-full min-h-[120px] resize-none"
                  placeholder="Leave a comment..."
                  value={claimData}
                  onChange={(e) => setClaimData(e.target.value)}
                  rows={6}
                />
                <div className="flex items-center justify-between">
                  <div className="text-sm text-base-content/60">
                    {!isConnected && 'Connect your wallet to make a claim'}
                  </div>
                  <button
                    onClick={handleMakeClaim}
                    disabled={!isConnected || isClaimPending || !claimData.trim()}
                    className="btn btn-primary"
                  >
                    {isClaimPending ? 'Submitting...' : 'Comment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Winners section */}
        {bounty.fulfilled && bounty.winners && bounty.winners.length > 0 && (
          <div className="border border-success/30 rounded-lg bg-success/5 mt-6 p-4">
            <h3 className="text-lg font-semibold mb-3 text-success">Winners</h3>
            <div className="space-y-2">
              {bounty.winners.map((winner, idx) => (
                <AddressDisplay key={idx} address={winner} size="md" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bounty;

