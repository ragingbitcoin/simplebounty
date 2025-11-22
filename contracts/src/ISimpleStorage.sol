// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.24;

interface ISimpleStorage {
    function storeSha256(bytes32 hash) external;
}

