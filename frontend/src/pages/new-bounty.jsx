import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAccount } from 'wagmi';
import { useCreateBounty } from '../hooks/useCreateBounty';
import WalletInfo from '../components/WalletInfo';
import TransactionStatus from '../components/TransactionStatus';
import { parseEther } from 'viem';
import { formatMarkdownWithFrontmatter } from '../utils/markdown';

const NewBounty = () => {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { createBountyWithETH, createBountyWithERC20, hash, isPending, isConfirming, isSuccess, error, reset } = useCreateBounty();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [useETH, setUseETH] = useState(true);
  const [tokenAddr, setTokenAddr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      // Format text with markdown frontmatter
      const formattedText = formatMarkdownWithFrontmatter(title, description);
      
      if (useETH) {
        const value = parseEther(amount);
        await createBountyWithETH(formattedText, value);
      } else {
        if (!tokenAddr || !tokenAddr.startsWith('0x')) {
          alert('Please enter a valid token address');
          return;
        }
        await createBountyWithERC20(formattedText, tokenAddr, amount);
      }
    } catch (err) {
      console.error('Error creating bounty:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-base-100 p-8">
        <div className="max-w-2xl mx-auto">
          <WalletInfo />
          <div className="alert alert-warning mt-4">
            <span>Please connect your wallet to create a bounty</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 p-8">
      <div className="max-w-2xl mx-auto">
        <WalletInfo />
        
        <button onClick={() => navigate('/')} className="btn btn-ghost btn-sm mb-4">
          ← Back to Bounties
        </button>

        <TransactionStatus
          status={isPending ? 'pending' : isSuccess ? 'success' : error ? 'error' : null}
          hash={hash}
          error={error}
          isConfirmed={isSuccess}
          reset={reset}
          onSuccess={() => {
            navigate('/');
          }}
        />

        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h1 className="text-4xl font-bold mb-6">Create New Bounty</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Title</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Enter a title for your bounty..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="Describe what you're looking for... (Markdown supported)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                />
                <label className="label">
                  <span className="label-text-alt">This will be stored as bytes32 on-chain. Markdown is supported.</span>
                </label>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Payment Method</span>
                </label>
                <div className="flex gap-4">
                  <label className="label cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      className="radio radio-primary"
                      checked={useETH}
                      onChange={() => setUseETH(true)}
                    />
                    <span className="label-text ml-2">ETH</span>
                  </label>
                  <label className="label cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      className="radio radio-primary"
                      checked={!useETH}
                      onChange={() => setUseETH(false)}
                    />
                    <span className="label-text ml-2">ERC20 Token</span>
                  </label>
                </div>
              </div>

              {useETH ? (
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Amount (ETH)</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    className="input input-bordered w-full"
                    placeholder="0.1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">Token Address</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full font-mono"
                      placeholder="0x..."
                      value={tokenAddr}
                      onChange={(e) => setTokenAddr(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">Amount (Tokens)</span>
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      className="input input-bordered w-full"
                      placeholder="100"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div className="card-actions justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isPending || isConfirming}
                >
                  {isPending || isConfirming ? 'Creating...' : 'Create Bounty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewBounty;

