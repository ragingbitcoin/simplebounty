# Simple Bounty Frontend

A decentralized bounty platform built with React and Web3. Users can create bounties, submit claims, and fulfill bounties using ETH or ERC20 tokens.

## Overview

Simple Bounty is a Web3 application that enables users to:
- **Create bounties** with descriptions and rewards (ETH or ERC20 tokens)
- **Submit claims** to complete bounties
- **Fulfill bounties** by selecting winning claims and distributing rewards
- **View all bounties** in a GitHub-style interface

Each bounty is represented as an ERC1155 token, allowing for efficient on-chain storage while keeping detailed descriptions and claim data stored off-chain on IPFS.

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

## Architecture

### Tech Stack
- **React 19** - UI framework
- **Wagmi v2** - Web3 React hooks
- **Viem v2** - Ethereum interactions
- **React Router v7** - Client-side routing
- **Tailwind CSS v4** - Styling
- **DaisyUI v5** - Component library
- **Webpack 5** - Module bundler

### Contract Integration

The frontend interacts with the `SimpleBounty` contract which:
- Inherits from ERC1155 (each bounty is a token)
- Uses `ReverseIndexable` for efficient event indexing
- Integrates with `SimpleStorage` for ENS contenthash events
- Uses `TokenRendererV2` for dynamic NFT metadata

## ReverseIndexable Pattern

### What is ReverseIndexable?

`ReverseIndexable` is an abstract contract that creates a linked chain of blocks with contract activity. This enables efficient indexing without scanning every block on the blockchain.

### How We Use It

The `SimpleBounty` contract inherits from `ReverseIndexable` and calls `touchIndex()` in the following scenarios:

1. **Token Transfers** - Automatically called via `_update()` when bounties are minted or transferred
2. **Bounty Top-ups** - When additional funds are added to a bounty
3. **Bounty Updates** - When the bounty description is updated
4. **Claim Attempts** - When someone submits a claim
5. **Claim Fulfillment** - When a bounty owner fulfills a claim

### Why We Use It

**Problem**: Traditional indexing requires scanning every block from deployment to find all events, which becomes expensive and slow as the chain grows.

**Solution**: The reverse indexing pattern creates a linked list of blocks:
- Each time `touchIndex()` is called, it emits a `BlockPointer` event with the previous activity block
- The contract stores the current block number in `blockPointer`
- Indexers can start from the current `blockPointer` and follow the chain backward

**Indexing Process**:
1. Read `blockPointer` from contract state (most recent activity block)
2. Query all events in that block using `eth_getLogs`
3. Find the `BlockPointer` event to get the previous activity block
4. Recursively follow the chain backward until reaching block 0

This pattern dramatically reduces the number of blocks that need to be queried, making indexing fast and efficient even as the contract ages.

### Implementation in Frontend

The frontend implements this pattern in `/src/utils/indexer.js`:
- `indexContractEvents()` - Recursively follows the blockPointer chain
- `getBlockEvents()` - Fetches all events from a specific block
- Discovers all bounty-related events (BountyCreated, ClaimAttempted, etc.) efficiently

## ENS Resolver & IPFS Data Pinning

### Overview

Simple Bounty uses a custom ENS resolver setup to enable decentralized data storage and retrieval via IPFS. This allows bounty descriptions and claim data to be stored off-chain while maintaining verifiable on-chain references.

### Architecture

1. **Data Domain**: `data.simplebounty.eth`
   - Configured with a custom resolver (`SimpleStorage` contract)
   - Stores contenthash records that point to IPFS data

2. **Host Domain**: `new.simplepage.eth`
   - Used by the DService client for IPFS pinning
   - Provides the API endpoint for uploading and fetching data

### How It Works

#### Uploading Data (Creating/Updating Bounties)

1. **Frontend** (`dservice-upload.js`):
   - User creates bounty description (markdown text)
   - Text is converted to a CAR (Content Addressable aRchive) file
   - CAR file is uploaded to SimplePage's dservice API using `new.simplepage.eth`
   - Returns a CID (Content Identifier) for the uploaded data

2. **On-Chain Storage**:
   - CID is converted to bytes32 (extracting the SHA-256 digest)
   - `SimpleBounty.create()` or `update()` is called with the bytes32 hash
   - Contract calls `SimpleStorage.storeSha256()` which:
     - Formats the hash as an ENS contenthash (IPFS CIDv1 format)
     - Emits a `ContenthashChanged` event for `data.simplebounty.eth`
   - The bytes32 hash is stored in the bounty's `data` field

#### Retrieving Data (Viewing Bounties)

1. **Frontend** reads the bytes32 hash from the contract
2. Converts bytes32 back to a CID by prepending CIDv1 prefix
3. Fetches the raw IPFS block from SimplePage's dservice API
4. Decodes the content as UTF-8 text (markdown)

### Why This Pattern?

**Benefits**:
- **Decentralized Storage**: Data is stored on IPFS, not centralized servers
- **Verifiable**: On-chain hash ensures data integrity
- **ENS Integration**: Contenthash events enable ENS-aware tools to discover data
- **Cost Efficient**: Only 32 bytes stored on-chain per description/claim
- **Censorship Resistant**: Data can be retrieved from any IPFS node

**SimplePage Integration**:
- SimplePage's dservice provides reliable IPFS pinning
- Uses `new.simplepage.eth` for the API endpoint (resolved via ENS)
- Ensures data remains accessible even if individual IPFS nodes go offline

### Technical Details

**CID Format**:
- Bounty data uses CIDv1 with raw codec (0x55) and SHA-256 (0x12)
- Format: `0x01` (CIDv1) + `0x55` (raw) + `0x12` (sha2-256) + `0x20` (32 bytes) + hash

**ENS Contenthash**:
- SimpleStorage emits contenthash in format: `0xe30101551220` + hash
- `0xe3` = IPFS protocol identifier
- `0x01` = CIDv1
- `0x55` = raw codec
- `0x12` = sha2-256
- `0x20` = 32 bytes

## User Flow

### 1. Landing Page (`/`)
- Displays all bounties in a card grid
- Shows bounty title, reward amount, creator, and fulfillment status
- Fetches titles from IPFS via dservice
- Click any bounty to view details

### 2. Create Bounty (`/new`)
- User enters bounty description (markdown supported)
- Selects reward token (ETH or ERC20)
- Enters reward amount
- Description is uploaded to IPFS, CID hash stored on-chain
- Bounty is created as ERC1155 token

### 3. View Bounty (`/:tokenId`)
- Displays full bounty details
- Shows description fetched from IPFS
- Lists all claims with their data
- Bounty owner can select and fulfill claims
- Anyone can submit new claims

### 4. Making a Claim
- User enters claim description (markdown)
- Description uploaded to IPFS
- `makeClaim()` called with CID hash
- Claim appears in bounty's claim list

### 5. Fulfilling a Claim
- Bounty owner selects a winning claim
- Calls `fulfillClaim()` with winner address and claim hash
- Contract distributes reward (minus 0.05% fee to beneficiary)
- Bounty is marked as fulfilled

## Build for Production

```bash
pnpm run build
```

Built files will be in the `dist/` directory.

## Notes

- Bounty descriptions and claims support markdown with frontmatter (title extraction)
- The contract charges a 0.05% fee on fulfillment (distributed to beneficiary)
- All data is stored on IPFS via SimplePage's dservice
- The reverse indexing pattern makes event discovery efficient even for old contracts
- ENS contenthash events enable integration with ENS-aware tools and resolvers
