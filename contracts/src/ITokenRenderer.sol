// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.24;

interface ITokenRenderer {
    function renderBounty(uint256 tokenId, bytes32 data, address tokenAddr, uint256 amount) external view returns (string memory);
}
