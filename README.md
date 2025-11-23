# Simple Bounty

A decentralized bounty platform built on Ethereum. Users can create bounties with ETH or ERC20 tokens, submit claims to complete them, and fulfill bounties by selecting winning claims.

## Overview

Simple Bounty is a Web3 application that enables:
- **Bounty Creation**: Create bounties with descriptions and rewards (ETH or ERC20)
- **Claim Submission**: Submit claims with detailed explanations
- **Bounty Fulfillment**: Bounty owners select winning claims and distribute rewards
- **Efficient Indexing**: Uses reverse indexing pattern for fast event discovery
- **Decentralized Storage**: Bounty descriptions and claims stored on IPFS via ENS

Each bounty is represented as an ERC1155 token, combining efficient on-chain storage with off-chain data storage on IPFS.

## Project Structure

```
simplebounty/
├── contracts/          # Solidity smart contracts (Foundry)
│   ├── src/           # Contract source files
│   ├── test/          # Contract tests
│   ├── script/        # Deployment scripts
│   └── docs/          # Contract documentation
└── frontend/          # React frontend application
    ├── src/           # React source files
    ├── public/        # Static assets
    └── dist/          # Build output
```

## Key Features

### ReverseIndexable Pattern

The contracts use a **reverse indexing pattern** to enable efficient event discovery without scanning every block:

- Creates a linked chain of blocks with contract activity
- Each activity block links to the previous activity block
- Indexers can follow the chain backward from the current `blockPointer`
- Dramatically reduces the number of blocks that need to be queried

**See**: [ReverseIndexable Documentation](contracts/src/ReverseIndexable.sol) and [Frontend README](frontend/README.md#reverseindexable-pattern) for details.

### ENS Resolver & IPFS Integration

Simple Bounty uses a custom ENS resolver setup for decentralized data storage:

- **Data Domain**: `data.simplebounty.eth` - Stores contenthash records pointing to IPFS data
- **Host Domain**: `new.simplepage.eth` - Provides SimplePage's dservice API for IPFS pinning
- Bounty descriptions and claims are stored on IPFS, with only 32-byte hashes stored on-chain
- `SimpleStorage` contract emits ENS `ContenthashChanged` events for discoverability

**See**: [Frontend README](frontend/README.md#ens-resolver--ipfs-data-pinning) for technical details.

## Quick Start

### Prerequisites

- **Node.js** (v18+) and **pnpm** for frontend
- **Foundry** for contracts development
- **Anvil** (included with Foundry) for local development

### Contracts Setup

1. Navigate to the contracts directory:
```bash
cd contracts
```

2. Install dependencies:
```bash
forge install
```

3. Build contracts:
```bash
make build
```

4. Run tests:
```bash
make test
```

5. Deploy to local network:
```bash
# Start Anvil in another terminal
anvil

# Deploy (uses deployer as beneficiary)
make deploy-dev-simple

# Or specify beneficiary and storage location
make deploy-dev <beneficiary_address> data.simplebounty.eth
```

**See**: [Contracts README](contracts/README.md) for detailed contract documentation.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env` file:
```bash
CHAIN_ID=1337  # or 11155111 for Sepolia, 1 for Mainnet
LOCAL_RPC_URL=http://127.0.0.1:8545
SEPOLIA_RPC_URL=your_sepolia_rpc_url
MAINNET_RPC_URL=your_mainnet_rpc_url
```

4. Start the development server:
```bash
pnpm run dev
```

The app will be available at `http://localhost:8080`

**See**: [Frontend README](frontend/README.md) for detailed frontend documentation.

## Architecture

### Smart Contracts

- **SimpleBounty** (`contracts/src/SimpleBounty.sol`)
  - ERC1155 contract where each bounty is a token
  - Inherits from `ReverseIndexable` for efficient indexing
  - Supports ETH and ERC20 token rewards
  - Charges 0.05% fee on fulfillment

- **ReverseIndexable** (`contracts/src/ReverseIndexable.sol`)
  - Abstract contract for reverse indexing pattern
  - Tracks last activity block and emits `BlockPointer` events

- **SimpleStorage** (`contracts/src/SimpleStorage.sol`)
  - Custom ENS resolver for `data.simplebounty.eth`
  - Emits `ContenthashChanged` events for IPFS data

- **TokenRendererV2** (`contracts/src/TokenRendererV2.sol`)
  - Dynamic NFT metadata renderer for bounty tokens

### Frontend

- **React 19** with **Wagmi v2** and **Viem v2** for Web3 interactions
- **React Router v7** for client-side routing
- **Tailwind CSS v4** with **DaisyUI v5** for styling
- **Reverse Indexing** implementation in `src/utils/indexer.js`
- **IPFS Integration** via SimplePage's dservice in `src/utils/dservice-upload.js`

## Development

### Contracts

```bash
cd contracts

# Build
make build

# Test
make test

# Format code
make format-fix

# Generate gas snapshots
make snapshot

# Deploy to Sepolia
make deploy-sepolia <beneficiary> <storageLocation>

# Deploy to Mainnet
make deploy <beneficiary> <storageLocation>
```

### Frontend

```bash
cd frontend

# Development server
pnpm run dev

# Production build
pnpm run build

# Build and publish to IPFS
pnpm run build:ipfs

# Stage to SimplePage
pnpm run stage
```

## Documentation

- **[Frontend README](frontend/README.md)** - Detailed frontend documentation, user flows, and technical details
- **[Contracts README](contracts/README.md)** - Contract development guide and deployment instructions
- **[Contract Source](contracts/src/)** - Inline Solidity documentation

## License

This project is licensed under the **GNU General Public License v3.0** - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please ensure:
- Code follows existing style conventions
- Tests pass for contracts (`make test`)
- Frontend builds successfully (`pnpm run build`)

## Links

- **ENS Domain**: `data.simplebounty.eth` (for data storage)
- **SimplePage**: Uses `new.simplepage.eth` for IPFS pinning service

