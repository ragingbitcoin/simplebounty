// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Triune.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

contract TriuneTest is Test, ERC1155Holder {
    Triune public triune;
    address public adept1 = address(0x1);
    address public adept2 = address(0x2);
    bytes public testData = bytes("test image data");

    function setUp() public {
        triune = new Triune(adept1, adept2, testData);
    }

    function test_InitialMint() public {
        // Check that deployer, adept1, and adept2 each got 1 token of ID 0
        assertEq(triune.balanceOf(address(this), 0), 1);
        assertEq(triune.balanceOf(adept1, 0), 1);
        assertEq(triune.balanceOf(adept2, 0), 1);
    }

    function test_TokenIdCounter() public {
        assertEq(triune.tokenIdCounter(), 1);
    }

    function test_ArtStorage() public {
        bytes memory storedArt = triune.art(0);
        assertEq(storedArt, testData);
    }

    function test_BindWithAccessToken() public {
        address newAdept1 = address(0x3);
        address newAdept2 = address(0x4);
        bytes memory newData = bytes("new ceremony data");

        // This contract has token 0, so it can bind
        triune.bind(0, newAdept1, newAdept2, newData);

        // Check new token was created
        assertEq(triune.tokenIdCounter(), 2);
        assertEq(triune.balanceOf(address(this), 1), 1);
        assertEq(triune.balanceOf(newAdept1, 1), 1);
        assertEq(triune.balanceOf(newAdept2, 1), 1);
    }

    function test_RevertWhen_BindWithoutAccessToken() public {
        address newAdept1 = address(0x3);
        address newAdept2 = address(0x4);
        bytes memory newData = bytes("new ceremony data");

        // Create a new address without any tokens and expect revert
        vm.prank(address(0x999));
        vm.expectRevert("Invalid membership, access token not found");
        triune.bind(0, newAdept1, newAdept2, newData);
    }

    function test_ReverseIndexableIntegration() public {
        uint256 initialBlock = block.number;
        
        // Transfer should trigger touchIndex
        vm.roll(initialBlock + 1);
        vm.prank(adept1);
        triune.safeTransferFrom(adept1, address(0x5), 0, 1, "");
        
        assertEq(triune.lastIndexedBlock(), initialBlock + 1);
    }

    function test_LastIndexedBlockUpdates() public {
        uint256 initialBlock = block.number;
        // Constructor already triggered touchIndex, so it should be at current block
        assertEq(triune.lastIndexedBlock(), initialBlock);

        // Bind should trigger touchIndex through _mint
        vm.roll(initialBlock + 5);
        triune.bind(0, address(0x6), address(0x7), bytes("data"));
        
        assertEq(triune.lastIndexedBlock(), initialBlock + 5);
    }

    function test_Uri() public {
        string memory tokenUri = triune.uri(0);
        // Should return the art data as string
        assertEq(tokenUri, string(testData));
    }

    function test_TotalSupply() public {
        // Token 0 was minted 3 times (deployer + 2 adepts)
        assertEq(triune.totalSupply(0), 3);
    }

    function test_Exists() public {
        assertTrue(triune.exists(0));
        assertFalse(triune.exists(999));
    }
}

