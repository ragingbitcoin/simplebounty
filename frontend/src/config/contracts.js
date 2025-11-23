// Contract configuration for SimpleBounty
// Update deployments with actual contract addresses after deployment

export const contracts = {
  deployments: {
    // Chain ID -> Contract Address
    1337: {
      SimpleBounty: process.env.SIMPLEBOUNTY_ADDRESS || '0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496', // Default from terminal output
    },
    11155111: {
      SimpleBounty: '0x092DcE3916271412b5e69727175187165A3c8ceE',
      SimpleStorage: '0xADe141cC757b319D014572224cc8F6ED838F7337',
      TokenRendererV2: '0x8258F0e2e61f767068A481FEF2dFA0A6Dd5526A5',
    },
    1: {
      SimpleBounty: process.env.SIMPLEBOUNTY_ADDRESS || '',
    },
  },
  abis: {
    SimpleBounty: [
      {
        "type": "constructor",
        "inputs": [
          { "name": "_beneficiary", "type": "address", "internalType": "address" },
          { "name": "_tokenRenderer", "type": "address", "internalType": "contract ITokenRenderer" },
          { "name": "_simpleStorage", "type": "address", "internalType": "contract ISimpleStorage" }
        ],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "create",
        "inputs": [
          { "name": "data", "type": "bytes32", "internalType": "bytes32" },
          { "name": "tokenAddr", "type": "address", "internalType": "address" },
          { "name": "amount", "type": "uint256", "internalType": "uint256" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "create",
        "inputs": [
          { "name": "data", "type": "bytes32", "internalType": "bytes32" }
        ],
        "outputs": [],
        "stateMutability": "payable"
      },
      {
        "type": "function",
        "name": "topUp",
        "inputs": [
          { "name": "tokenId", "type": "uint256", "internalType": "uint256" },
          { "name": "tokenAddr", "type": "address", "internalType": "address" },
          { "name": "amount", "type": "uint256", "internalType": "uint256" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "topUp",
        "inputs": [
          { "name": "tokenId", "type": "uint256", "internalType": "uint256" }
        ],
        "outputs": [],
        "stateMutability": "payable"
      },
      {
        "type": "function",
        "name": "update",
        "inputs": [
          { "name": "tokenId", "type": "uint256", "internalType": "uint256" },
          { "name": "data", "type": "bytes32", "internalType": "bytes32" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "makeClaim",
        "inputs": [
          { "name": "tokenId", "type": "uint256", "internalType": "uint256" },
          { "name": "data", "type": "bytes32", "internalType": "bytes32" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "fulfillClaim",
        "inputs": [
          { "name": "tokenId", "type": "uint256", "internalType": "uint256" },
          { "name": "winner", "type": "address", "internalType": "address" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "getBounty",
        "inputs": [
          { "name": "tokenId", "type": "uint256", "internalType": "uint256" }
        ],
        "outputs": [
          { "name": "data", "type": "bytes32", "internalType": "bytes32" },
          { "name": "tokenAddr", "type": "address", "internalType": "address" },
          { "name": "amount", "type": "uint256", "internalType": "uint256" }
        ],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "tokenIdCounter",
        "inputs": [],
        "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "blockPointer",
        "inputs": [],
        "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "balanceOf",
        "inputs": [
          { "name": "account", "type": "address", "internalType": "address" },
          { "name": "id", "type": "uint256", "internalType": "uint256" }
        ],
        "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "uri",
        "inputs": [
          { "name": "tokenId", "type": "uint256", "internalType": "uint256" }
        ],
        "outputs": [{ "name": "", "type": "string", "internalType": "string" }],
        "stateMutability": "view"
      },
      {
        "type": "event",
        "name": "BountyCreated",
        "inputs": [
          { "name": "tokenId", "type": "uint256", "indexed": true, "internalType": "uint256" },
          { "name": "data", "type": "bytes32", "indexed": false, "internalType": "bytes32" },
          { "name": "tokenAddr", "type": "address", "indexed": false, "internalType": "address" },
          { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" },
          { "name": "creator", "type": "address", "indexed": false, "internalType": "address" }
        ],
        "anonymous": false
      },
      {
        "type": "event",
        "name": "BountyToppedUp",
        "inputs": [
          { "name": "tokenId", "type": "uint256", "indexed": true, "internalType": "uint256" },
          { "name": "tokenAddr", "type": "address", "indexed": false, "internalType": "address" },
          { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" }
        ],
        "anonymous": false
      },
      {
        "type": "event",
        "name": "BountyUpdated",
        "inputs": [
          { "name": "tokenId", "type": "uint256", "indexed": true, "internalType": "uint256" },
          { "name": "newData", "type": "bytes32", "indexed": false, "internalType": "bytes32" }
        ],
        "anonymous": false
      },
      {
        "type": "event",
        "name": "ClaimAttempted",
        "inputs": [
          { "name": "tokenId", "type": "uint256", "indexed": true, "internalType": "uint256" },
          { "name": "claimant", "type": "address", "indexed": false, "internalType": "address" },
          { "name": "claimData", "type": "bytes32", "indexed": false, "internalType": "bytes32" }
        ],
        "anonymous": false
      },
      {
        "type": "event",
        "name": "ClaimFulfilled",
        "inputs": [
          { "name": "tokenId", "type": "uint256", "indexed": true, "internalType": "uint256" },
          { "name": "winner", "type": "address", "indexed": false, "internalType": "address" }
        ],
        "anonymous": false
      },
      {
        "type": "event",
        "name": "BlockPointer",
        "inputs": [
          { "name": "previousBlock", "type": "uint256", "indexed": false, "internalType": "uint256" }
        ],
        "anonymous": false
      },
      {
        "type": "event",
        "name": "TransferSingle",
        "inputs": [
          { "name": "operator", "type": "address", "indexed": true, "internalType": "address" },
          { "name": "from", "type": "address", "indexed": true, "internalType": "address" },
          { "name": "to", "type": "address", "indexed": true, "internalType": "address" },
          { "name": "id", "type": "uint256", "indexed": false, "internalType": "uint256" },
          { "name": "value", "type": "uint256", "indexed": false, "internalType": "uint256" }
        ],
        "anonymous": false
      }
    ]
  }
};

