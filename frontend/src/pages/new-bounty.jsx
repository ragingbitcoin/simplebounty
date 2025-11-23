import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { useCreateBounty } from '../hooks/useCreateBounty';
import WalletInfo from '../components/WalletInfo';
import TransactionStatus from '../components/TransactionStatus';
import { parseEther, formatUnits } from 'viem';
import { formatMarkdownWithFrontmatter } from '../utils/markdown';
import { useChainId } from '../hooks/useChainId';
import { getTokensForChain } from '../config/tokens';

const NewBounty = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { createBountyWithETH, createBountyWithERC20, hash, isPending, isConfirming, isSuccess, error, reset } = useCreateBounty();
  const chainId = useChainId();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [customTokenAddr, setCustomTokenAddr] = useState('');

  // Get available tokens for current chain (includes ETH as first option)
  const availableTokens = useMemo(() => getTokensForChain(chainId), [chainId]);
  
  // Check if ETH is selected (null address) or custom token is selected
  const isETH = selectedToken === 'ETH';
  const isCustomToken = selectedToken === 'CUSTOM';
  const isERC20 = selectedToken && selectedToken !== 'ETH' && selectedToken !== 'CUSTOM';
  
  // Get the actual token address to use
  const tokenAddress = isETH 
    ? null // ETH uses null address
    : isCustomToken 
      ? customTokenAddr 
      : selectedToken; // ERC20 token address

  // Get selected token info for decimals and symbol
  const selectedTokenInfo = useMemo(() => {
    if (isETH) {
      return { symbol: 'ETH', decimals: 18 };
    }
    if (isCustomToken) {
      return { symbol: 'Token', decimals: 18 }; // Default to 18 for custom tokens
    }
    return availableTokens.find(t => (t.address || 'ETH') === selectedToken) || { symbol: 'Token', decimals: 18 };
  }, [isETH, isCustomToken, selectedToken, availableTokens]);

  // Standard ERC20 ABI for balanceOf and decimals
  const erc20Abi = [
    {
      name: 'balanceOf',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }],
    },
    {
      name: 'decimals',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'uint8' }],
    },
    {
      name: 'symbol',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'string' }],
    },
  ];

  // Fetch ETH balance
  const { data: ethBalance } = useBalance({
    address: address,
    query: {
      enabled: isConnected && isETH,
    },
  });

  // Fetch ERC20 token balance (for both known and custom tokens)
  const { data: tokenBalance } = useReadContract({
    address: tokenAddress && tokenAddress.startsWith('0x') ? tokenAddress : undefined,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && (isERC20 || isCustomToken) && !!tokenAddress && tokenAddress.startsWith('0x'),
    },
  });

  // Fetch token decimals (for custom tokens, or as fallback)
  const { data: tokenDecimals } = useReadContract({
    address: tokenAddress && tokenAddress.startsWith('0x') ? tokenAddress : undefined,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: isConnected && (isERC20 || isCustomToken) && !!tokenAddress && tokenAddress.startsWith('0x'),
    },
  });

  // Fetch token symbol for custom tokens
  const { data: tokenSymbol } = useReadContract({
    address: tokenAddress && tokenAddress.startsWith('0x') ? tokenAddress : undefined,
    abi: erc20Abi,
    functionName: 'symbol',
    query: {
      enabled: isConnected && isCustomToken && !!tokenAddress && tokenAddress.startsWith('0x'),
    },
  });

  // Get raw balance value for max button
  const rawBalance = useMemo(() => {
    if (!isConnected || !selectedToken) return null;
    
    if (isETH && ethBalance) {
      return ethBalance.value;
    }
    
    if ((isERC20 || isCustomToken) && tokenBalance) {
      return tokenBalance;
    }
    
    return null;
  }, [isConnected, selectedToken, isETH, isERC20, isCustomToken, ethBalance, tokenBalance]);

  // Get decimals for formatting
  const balanceDecimals = useMemo(() => {
    if (isETH) return 18;
    if (isERC20 || isCustomToken) {
      return tokenDecimals !== undefined ? Number(tokenDecimals) : (selectedTokenInfo?.decimals || 18);
    }
    return 18;
  }, [isETH, isERC20, isCustomToken, tokenDecimals, selectedTokenInfo]);

  // Format balance for display
  const formattedBalance = useMemo(() => {
    if (!isConnected || !selectedToken) return null;
    
    if (isETH) {
      if (ethBalance) {
        return `${formatUnits(ethBalance.value, ethBalance.decimals)} ETH`;
      }
      return '0 ETH';
    }
    
    if (isERC20 || isCustomToken) {
      const symbol = isCustomToken && tokenSymbol ? String(tokenSymbol) : (selectedTokenInfo?.symbol || 'Token');
      
      if (tokenBalance) {
        return `${formatUnits(tokenBalance, balanceDecimals)} ${symbol}`;
      }
      return `0 ${symbol}`;
    }
    
    return null;
  }, [isConnected, selectedToken, isETH, isERC20, isCustomToken, ethBalance, tokenBalance, balanceDecimals, tokenSymbol, selectedTokenInfo]);

  // Handle max button click
  const handleMaxClick = () => {
    if (rawBalance) {
      const maxAmount = formatUnits(rawBalance, balanceDecimals);
      setAmount(maxAmount);
    }
  };

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
      
      if (isETH) {
        // Use ETH payment
        const value = parseEther(amount);
        await createBountyWithETH(formattedText, value);
      } else {
        // Use ERC20 token payment
        if (!tokenAddress || !tokenAddress.startsWith('0x')) {
          alert('Please select a token or enter a valid token address');
          return;
        }
        // Get the correct decimals for the token
        const tokenDecimalsValue = tokenDecimals !== undefined 
          ? Number(tokenDecimals) 
          : (selectedTokenInfo?.decimals || 18);
        await createBountyWithERC20(formattedText, tokenAddress, amount, tokenDecimalsValue);
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
                  <span className="label-text font-semibold">Token</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={selectedToken}
                  onChange={(e) => {
                    setSelectedToken(e.target.value);
                    if (e.target.value !== 'CUSTOM') {
                      setCustomTokenAddr('');
                    }
                  }}
                  required
                >
                  <option value="" disabled>Select a token...</option>
                  {availableTokens.map((token) => (
                    <option key={token.address || 'ETH'} value={token.address || 'ETH'}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                  <option value="CUSTOM">Add asset manually</option>
                </select>
                {isCustomToken && (
                  <div className="mt-2">
                    <input
                      type="text"
                      className="input input-bordered w-full font-mono"
                      placeholder="0x..."
                      value={customTokenAddr}
                      onChange={(e) => setCustomTokenAddr(e.target.value)}
                      required
                    />
                    <label className="label">
                      <span className="label-text-alt">Enter the token contract address</span>
                    </label>
                  </div>
                )}
                {isERC20 && (
                  <label className="label">
                    <span className="label-text-alt font-mono text-xs">
                      {tokenAddress}
                    </span>
                  </label>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Amount {isETH ? '(ETH)' : `(${selectedTokenInfo?.symbol || 'Tokens'})`}
                    </span>
                  </label>
                  {formattedBalance && rawBalance && (
                    <button
                      type="button"
                      onClick={handleMaxClick}
                      className="label-text-alt text-sm text-primary hover:text-primary-focus cursor-pointer underline"
                    >
                      Max: {formattedBalance}
                    </button>
                  )}
                  {formattedBalance && !rawBalance && (
                    <span className="label-text-alt text-sm text-base-content/60">
                      Max: {formattedBalance}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  className="input input-bordered w-full"
                  placeholder={isETH ? "0.1" : "100"}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

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

