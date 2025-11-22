// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/SimpleBounty.sol";
import "../src/TokenRendererV2.sol";
import "../src/SimpleStorage.sol";
import "../src/ISimpleStorage.sol";

/// @notice Test script for SimpleBounty rendering
/// @dev Creates a bounty and tests the metadata URI generation
contract TestSimpleBountyScript is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy SimpleStorage
        SimpleStorage simpleStorage = new SimpleStorage("data.simplebounty.eth");
        console.log("SimpleStorage deployed at:", address(simpleStorage));

        // Deploy TokenRendererV2
        TokenRendererV2 renderer = new TokenRendererV2();
        console.log("TokenRendererV2 deployed at:", address(renderer));

        // Deploy SimpleBounty with renderer and SimpleStorage
        address beneficiary = address(0x1234567890123456789012345678901234567890);
        SimpleBounty bounty = new SimpleBounty(beneficiary, ITokenRenderer(renderer), ISimpleStorage(address(simpleStorage)));
        console.log("SimpleBounty deployed at:", address(bounty));

        // Transfer ownership of SimpleStorage to SimpleBounty
        simpleStorage.transferOwnership(address(bounty));

        // Create a bounty with ETH
        bytes32 bountyData = keccak256("Test bounty description");
        bounty.create{value: 1 ether}(bountyData);
        
        uint256 tokenId = 0;
        console.log("Created bounty with tokenId:", tokenId);

        // Get the URI for the bounty
        string memory uri = bounty.uri(tokenId);
        console.log("TOKEN_URI:", uri);

        // Create another bounty with ERC20 (use address(0) as placeholder, would need real token for actual test)
        // For testing purposes, let's create another ETH bounty
        bytes32 bountyData2 = keccak256("Another test bounty");
        bounty.create{value: 0.5 ether}(bountyData2);
        
        uint256 tokenId2 = 1;
        console.log("Created bounty with tokenId:", tokenId2);
        
        string memory uri2 = bounty.uri(tokenId2);
        console.log("TOKEN_URI:", uri2);

        vm.stopBroadcast();
    }
}

