// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.24;

struct PageData {
    string domain;
    uint256[] units;
}

interface ISimplePage {
    function getPageData(uint256 tokenId) external view returns (PageData memory);
}
