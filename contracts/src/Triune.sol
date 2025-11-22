/* SPDX-License-Identifier: GPL-3.0-only
  ▄▄▄▄▄▄▄▄▄▄  ▄▄  ▄                  ▄█▄                      ▄  ▄▄  ▄▄▄▄▄▄▄▄▄▄
 █▄▓▄                               ██▀██                                   ▄▓▄█
 █                                ▄█▀   ▀█    ▄█▄                              █
 █                               ▄█       █  ██▀██                             █
 █                              ██   ▄█▄   ▄█▀   ▀█▄                           █
 █                            ▄█▀   ██▀██  █ ▄     █▄                          █
 █                           ▄█   ▄█▀   ▀█▄   █     ██                         █
 █                          ██   ▄█     ▄ █▄   ██    ▀█▄                       █
 █                         █▀   ▀▀    ▄█   ▀▀   ▀█     █▄                      █
 █                         ▀▀▀▀▀▀▀▀▀ ██  ▀▀▀▀▀▀▀▀▀      ██                     █
 █                           ▄█     █▀        █▄         ▀█                    █
 █                          ██      ▀▀▀▀▀▀▀▀▀  ██ ▀▀▀▀▀▀▀▀▀                    █
 █                         █▀                   ▀█
 █▄▓▄▄                     ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀                         ▄▄▓▄█
 █                                                                             █
 █  ░  Release Information                                                     █
 █  ░ ---------------- -                                                       █
 █                                                                             █
 █  ░  Contract . : Triune                                                     █
 █  ░  License .. : GPL-3.0-only                                               █
 █  ░  Language . : Solidity                                                   █
 █  ░  Standard . : ERC1155                                                    █
 ▓  ░  Version .. : 1.0.0                                                      ▓
 ▒  ░  Deployed . : 2025-XX-XX                                                 ▒
 ░                                                                             ░
*/
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "./ReverseIndexable.sol";

/// @title Triune NFT Contract
/// @dev Inherits from ERC1155 and ReverseIndexable
contract Triune is ERC1155Supply, ReverseIndexable {
    string public name = "Triune";
    string public symbol = "TRE";
    
    mapping(uint256 => bytes) public art;
    uint256 public tokenIdCounter = 0;


    /// @notice Initializes the Triune contract
    /// @dev Sets the base URI for metadata
    constructor(address new1, address new2, bytes memory data) ERC1155("") {
        _bind(new1, new2, data);
    }

    /// @notice Binds a new ceremony to the Triune
    /// @param accessTokenId The ID of the access token
    /// @param adept1 The address of the first adept
    /// @param adept2 The address of the second adept
    /// @param data The data for the new ceremony
    function bind(uint256 accessTokenId, address adept1, address adept2, bytes memory data) public {
        require(balanceOf(msg.sender, accessTokenId) > 0, "Invalid membership, access token not found");
        _bind(adept1, adept2, data);
    }

    function _bind(address adept1, address adept2, bytes memory image) internal {
        // inc counter and use as tokenId
        art[tokenIdCounter] = image;
        _mint(msg.sender, tokenIdCounter, 1, "");
        _mint(adept1, tokenIdCounter, 1, "");
        _mint(adept2, tokenIdCounter, 1, "");
        tokenIdCounter += 1;
    }

    /// @inheritdoc ERC1155Supply
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal virtual override {
        super._update(from, to, ids, values);
        touchIndex();
    }

    /// @notice Returns the URI for a given token ID
    /// @dev Overrides the ERC1155 uri function
    /// @param tokenId The ID of the token to query
    /// @return The URI string for the token metadata
    function uri(uint256 tokenId) public view virtual override returns (string memory) {
        require(exists(tokenId), "ERC1155: URI query for nonexistent token");
        // TODO: return proper erc1155 metadata
        return string(art[tokenId]);
    }
}
