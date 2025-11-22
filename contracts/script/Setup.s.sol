// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/Triune.sol";

/*
To deploy Triune contract:

forge script script/Setup.s.sol:SetupScript \
    --rpc-url <your_rpc_url> \
    --private-key <your_private_key> \
    --broadcast \
    --verify \
    -vvvv \
    --sig "run(address,address,bytes)" <adept1_address> <adept2_address> <initial_art_data>

Example:
forge script script/Setup.s.sol:SetupScript \
    --rpc-url https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY \
    --private-key 0xabc123... \
    --broadcast \
    --verify \
    -vvvv \
    --sig "run(address,address,bytes)" 0x1111... 0x2222... 0x...

Note: 
- Replace <your_rpc_url> with your RPC endpoint
- Replace <your_private_key> with deployer private key
- Replace <adept1_address> and <adept2_address> with the two adept addresses
- Replace <initial_art_data> with the initial ceremony art data (bytes)
*/

contract SetupScript is Script {
    function run(address adept1, address adept2, bytes memory initialArt) external {
        vm.startBroadcast();

        (, address msgSender,) = vm.readCallers();
        console.log("Deployer:", msgSender);
        console.log("Adept 1:", adept1);
        console.log("Adept 2:", adept2);

        // Deploy Triune contract with initial ceremony
        Triune triune = new Triune(adept1, adept2, initialArt);

        vm.stopBroadcast();

        console.log("Triune deployed to:", address(triune));
        console.log("Initial token ID 0 minted to deployer, adept1, and adept2");
        console.log("Total supply of token 0:", triune.totalSupply(0));
    }
    
    // Simplified deployment for testing (uses empty initial art)
    function runSimple(address adept1, address adept2) external {
        vm.startBroadcast();

        (, address msgSender,) = vm.readCallers();
        console.log("Deployer:", msgSender);
        console.log("Adept 1:", adept1);
        console.log("Adept 2:", adept2);

        // Deploy Triune contract with empty initial ceremony art
        Triune triune = new Triune(adept1, adept2, bytes(""));

        vm.stopBroadcast();

        console.log("Triune deployed to:", address(triune));
        console.log("Initial token ID 0 minted to deployer, adept1, and adept2");
        console.log("Total supply of token 0:", triune.totalSupply(0));
    }
}
