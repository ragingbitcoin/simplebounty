// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.24;

interface ITokenRenderer {
    function renderPage(uint256 tokenId) external view returns (string memory);
}
