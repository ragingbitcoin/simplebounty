// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/SimpleBounty.sol";
import "../src/TokenRendererV2.sol";

/*
To deploy SimpleBounty contract:

forge script script/Setup.s.sol:SetupScript \
    --rpc-url <your_rpc_url> \
    --private-key <your_private_key> \
    --broadcast \
    --verify \
    -vvvv \
    --sig "run(address,string)" <beneficiary_address> <storage_location>

Example:
forge script script/Setup.s.sol:SetupScript \
    --rpc-url https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY \
    --private-key 0xabc123... \
    --broadcast \
    --verify \
    -vvvv \
    --sig "run(address,string)" 0x1111... "data.simplebounty.eth"

Note: 
- Replace <your_rpc_url> with your RPC endpoint
- Replace <your_private_key> with deployer private key
- Replace <beneficiary_address> with the address that will receive fees
- Replace <storage_location> with the ENS name for SimpleStorage (e.g., "data.simplebounty.eth")
*/

contract SetupScript is Script {
    function run(address beneficiary, string memory storageLocation) external {
        vm.startBroadcast();

        (, address msgSender,) = vm.readCallers();
        console.log("Deployer:", msgSender);
        console.log("Beneficiary:", beneficiary);
        console.log("Storage Location:", storageLocation);

        // Deploy TokenRendererV2 first
        TokenRendererV2 renderer = new TokenRendererV2();
        console.log("TokenRendererV2 deployed to:", address(renderer));

        // Deploy SimpleBounty with renderer and storage location
        SimpleBounty bounty = new SimpleBounty(beneficiary, ITokenRenderer(renderer), storageLocation);
        console.log("SimpleBounty deployed to:", address(bounty));
        console.log("SimpleStorage deployed to:", address(bounty.simpleStorage()));

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("TokenRendererV2:", address(renderer));
        console.log("SimpleBounty:", address(bounty));
        console.log("SimpleStorage:", address(bounty.simpleStorage()));
        console.log("Beneficiary:", beneficiary);
    }
    
    // Simplified deployment for testing (uses deployer as beneficiary and default storage location)
    function runSimple() external {
        vm.startBroadcast();

        (, address msgSender,) = vm.readCallers();
        console.log("Deployer:", msgSender);

        // Use deployer as beneficiary
        address beneficiary = msgSender;
        
        // Use default storage location
        string memory storageLocation = "data.simplebounty.eth";

        // Deploy TokenRendererV2 first
        TokenRendererV2 renderer = new TokenRendererV2();
        console.log("TokenRendererV2 deployed to:", address(renderer));

        // Deploy SimpleBounty with renderer and storage location
        SimpleBounty bounty = new SimpleBounty(beneficiary, ITokenRenderer(renderer), storageLocation);
        console.log("SimpleBounty deployed to:", address(bounty));
        console.log("SimpleStorage deployed to:", address(bounty.simpleStorage()));

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("TokenRendererV2:", address(renderer));
        console.log("SimpleBounty:", address(bounty));
        console.log("SimpleStorage:", address(bounty.simpleStorage()));
        console.log("Beneficiary:", beneficiary);
    }
}
