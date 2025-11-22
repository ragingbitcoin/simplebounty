// Contract configuration for SimpleBounty
// Update deployments with actual contract addresses after deployment

export const contracts = {
  deployments: {
    // Chain ID -> Contract Address
    1337: {
      SimpleBounty: process.env.SIMPLEBOUNTY_ADDRESS || '0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496', // Default from terminal output
    },
    11155111: {
      SimpleBounty: '0x94c62D2c2017d7cD2aD110A6EEfb08f4A3D5f59C',
      SimpleStorage: '0xC9c81A87d535Af9a534b752dA067EB0798c2ECB1',
      TokenRendererV2: '0x70Dd1ab271D7b1fCD31ab58AAcc1B25Fac799BAC',
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
          { "name": "winners", "type": "address[]", "internalType": "address[]" }
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
          { "name": "winners", "type": "address[]", "indexed": false, "internalType": "address[]" }
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

