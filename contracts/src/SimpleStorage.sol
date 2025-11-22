// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./NameCoder.sol";

/// @title SimpleStorage - Custom ENS Resolver
/// @notice Implements a custom ENS resolver that emits ContenthashChanged events
contract SimpleStorage is Ownable {
    /// @notice The ENS namehash stored in the constructor
    bytes32 public ensNode;

    /// @notice Emitted when the contenthash for a node changes
    /// @param node The ENS node (namehash)
    /// @param hash The new contenthash
    event ContenthashChanged(bytes32 indexed node, bytes hash);

    /// @notice Constructor that takes an ENS name and stores its namehash
    /// @param ensName The ENS name (e.g., "data.simplebounty.eth")
    constructor(string memory ensName) Ownable(msg.sender) {
        bytes memory dnsEncoded = NameCoder.encode(ensName);
        ensNode = NameCoder.namehash(dnsEncoded, 0);
    }

    /// @notice Stores a SHA256 hash and emits ContenthashChanged event
    /// @dev Creates a multihash with keccak-256 (0x1b), then wraps it in CIDv1 (0x01), then prepends IPFS protocol (0xe3)
    /// @param hash The bytes32 hash to store
    function storeSha256(bytes32 hash) external onlyOwner {
        // Create ENS contenthash: 0xe301 (IPFS), 0x01 (CIDv1), 0x55 (raw) 0x12 (sha2-256), 0x20 (32 bytes), then the hash
        bytes memory contenthash = abi.encodePacked(hex"e30101551220", hash);
        
        // Emit the ContenthashChanged event
        emit ContenthashChanged(ensNode, contenthash);
    }
}

