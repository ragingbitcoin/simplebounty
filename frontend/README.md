# Triune Frontend

A meditation ceremony app where a meditation session gives you a membership token.

## Overview

Triune is a three-person meditation ceremony app built with React and Web3. When you complete a ceremony, you and two other participants each receive a membership token (ERC1155).

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create a `.env` file with your configuration:
```bash
CHAIN_ID=1337  # or 11155111 for Sepolia, 1 for Mainnet
LOCAL_RPC_URL=http://127.0.0.1:8545
SEPOLIA_RPC_URL=your_sepolia_rpc_url
MAINNET_RPC_URL=your_mainnet_rpc_url
```

3. Start the dev server:
```bash
pnpm run dev
```

The app will be available at `http://localhost:8080`

## User Flow

### 1. Connect Wallet (`/`)
- User is presented with a clean interface asking them to connect their wallet
- Supports Injected wallets (MetaMask, etc.) and Safe wallets
- Auto-redirects to the next step once connected

### 2. Enter Addresses (`/addresses`)
- User inputs two Ethereum addresses for the other ceremony participants
- Validation ensures:
  - Addresses are valid Ethereum addresses
  - User cannot use their own address
  - Both addresses are different
- Proceeds to drawing page once validated

### 3. Draw & Submit (`/draw`)
- User draws their meditation visualization in a triangular canvas
- Drawing tools:
  - Color picker
  - Brush size slider
  - Clear canvas button
- Shows all three participants' addresses
- Submit button creates the ceremony on-chain
- All three participants receive a membership token (ERC1155)

## Contract Integration

⚠️ **Important**: You need to update the contract address in `/Users/joel/code/triune/frontend/src/pages/draw.jsx`

Find this section around line 111:
```javascript
const CONTRACT_ADDRESS = '0xYourContractAddress'; // You'll need to set this
```

Replace with your deployed Triune contract address.

The contract ABI is already configured for the `bind` function which expects:
- `accessTokenId` (uint256) - Currently hardcoded to 0
- `adept1` (address) - First participant address
- `adept2` (address) - Second participant address  
- `data` (bytes) - The drawing data as base64-encoded PNG

## Architecture

- **React 19** - UI framework
- **Wagmi v2** - Web3 React hooks
- **Viem v2** - Ethereum interactions
- **React Router v7** - Client-side routing
- **Tailwind CSS v4** - Styling
- **DaisyUI v5** - Component library
- **Webpack 5** - Module bundler

## Build for Production

```bash
pnpm run build
```

Built files will be in the `dist/` directory.

## Notes

- The drawing is converted to a PNG data URL and stored on-chain as bytes
- The current implementation uses `accessTokenId = 0` - you may want to make this dynamic based on your tokenomics
- The MetaMask SDK warning during compilation is normal and doesn't affect functionality
