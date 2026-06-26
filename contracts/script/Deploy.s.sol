// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ProvenanceRegistry} from "../src/ProvenanceRegistry.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        ProvenanceRegistry registry = new ProvenanceRegistry();

        vm.stopBroadcast();

        console.log("ProvenanceRegistry deployed at:", address(registry));
    }
}
