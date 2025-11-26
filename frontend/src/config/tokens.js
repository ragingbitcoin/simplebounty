// Token list with addresses for common tokens on Sepolia and Mainnet
// Chain IDs: 1 = Mainnet, 11155111 = Sepolia

export const tokens = [
  {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    addresses: {
      1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Mainnet
      11155111: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia
    },
  },
  {
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    addresses: {
      1: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Mainnet
      11155111: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0', // Sepolia
    },
  },
  {
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
    addresses: {
      1: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // Mainnet
      11155111: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357', // Sepolia
    },
  },
  {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    addresses: {
      1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Mainnet
      11155111: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', // Sepolia
    },
  },
  {
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    decimals: 8,
    addresses: {
      1: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // Mainnet
      11155111: '0x29f2D40B0605204364af54EC677bD022dA425d03', // Sepolia
    },
  },
  {
    name: 'Chainlink',
    symbol: 'LINK',
    decimals: 18,
    addresses: {
      1: '0x514910771AF9Ca656af840dff83E8264EcF986CA', // Mainnet
      11155111: '0x779877A7B0D9E8603169DdbD7836e478b4624789', // Sepolia
    },
  },
  {
    name: 'Uniswap',
    symbol: 'UNI',
    decimals: 18,
    addresses: {
      1: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // Mainnet
      11155111: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // Sepolia
    },
  },
  {
    name: 'Lido Staked Ether',
    symbol: 'stETH',
    decimals: 18,
    addresses: {
      1: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', // Mainnet
      11155111: '0x3e3FE7dBc6B4C189E7128855dD526361c49b40Af', // Sepolia
    },
  },
  {
    name: 'Wrapped Staked Ether',
    symbol: 'wstETH',
    decimals: 18,
    addresses: {
      1: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0', // Mainnet
      11155111: '0xB82381A3fBD3FaFA77B3a7bE693342618240067b', // Sepolia
    },
  },
  {
    name: 'BIT',
    symbol: 'BIT',
    decimals: 18,
    addresses: {
      1: '0xa27b118c0770939295f052aE1b003366E5eF806F', // Mainnet
      11155111: '0xa27b118c0770939295f052aE1b003366E5eF806F', // Sepolia
    },
  },
];

/**
 * Get tokens available for a specific chain ID, including ETH as the first option
 * @param {number} chainId - The chain ID (1 for Mainnet, 11155111 for Sepolia)
 * @returns {Array} Array of tokens with address for the specified chain, ETH first
 */
export function getTokensForChain(chainId) {
  // ETH is always available (native token, no address)
  const ethToken = {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    address: null, // null address indicates native ETH
  };

  // Get all ERC20 tokens for this chain
  const erc20Tokens = tokens
    .filter(token => token.addresses[chainId])
    .map(token => ({
      ...token,
      address: token.addresses[chainId],
    }));

  // Return ETH first, then ERC20 tokens
  return [ethToken, ...erc20Tokens];
}

/**
 * Get token by address and chain ID
 * @param {string} address - The token contract address
 * @param {number} chainId - The chain ID
 * @returns {Object|null} Token object or null if not found
 */
export function getTokenByAddress(address, chainId) {
  if (!address) return null;
  const normalizedAddress = address.toLowerCase();
  return tokens.find(token => 
    token.addresses[chainId]?.toLowerCase() === normalizedAddress
  ) || null;
}

export default tokens;

