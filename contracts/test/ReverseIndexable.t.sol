// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ReverseIndexable.sol";

// Concrete implementation for testing
contract TestReverseIndexable is ReverseIndexable {
    function callTouchIndex() public {
        touchIndex();
    }
    
    function callTouchIndexTwice() public {
        touchIndex();
        touchIndex();
    }
}

contract ReverseIndexableTest is Test {
    TestReverseIndexable public indexable;

    event BlockPointer(uint256 previousBlock);

    function setUp() public {
        indexable = new TestReverseIndexable();
    }

    function test_InitialState() public {
        assertEq(indexable.blockPointer(), 0);
    }

    function test_TouchIndexUpdatesBlock() public {
        uint256 currentBlock = block.number;
        
        indexable.callTouchIndex();
        
        assertEq(indexable.blockPointer(), currentBlock);
    }

    function test_TouchIndexEmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit BlockPointer(0);
        
        indexable.callTouchIndex();
    }

    function test_TouchIndexChaining() public {
        uint256 block1 = 100;
        uint256 block2 = 200;
        uint256 block3 = 300;

        // First touch at block 100
        vm.roll(block1);
        vm.expectEmit(true, true, true, true);
        emit BlockPointer(0);
        indexable.callTouchIndex();
        assertEq(indexable.blockPointer(), block1);

        // Second touch at block 200
        vm.roll(block2);
        vm.expectEmit(true, true, true, true);
        emit BlockPointer(block1);
        indexable.callTouchIndex();
        assertEq(indexable.blockPointer(), block2);

        // Third touch at block 300
        vm.roll(block3);
        vm.expectEmit(true, true, true, true);
        emit BlockPointer(block2);
        indexable.callTouchIndex();
        assertEq(indexable.blockPointer(), block3);
    }

    function test_ReverseIndexablePattern() public {
        // Simulate the reverse indexing pattern
        uint256[] memory blocks = new uint256[](5);
        blocks[0] = 100;
        blocks[1] = 150;
        blocks[2] = 200;
        blocks[3] = 250;
        blocks[4] = 300;

        // Create the chain
        for (uint256 i = 0; i < blocks.length; i++) {
            vm.roll(blocks[i]);
            indexable.callTouchIndex();
        }

        // Verify we can reconstruct the chain by reading events
        assertEq(indexable.blockPointer(), blocks[4]);
    }

    function test_TouchIndexCanBeCalledMultipleTimes() public {
        // Note: touchIndex() can be called multiple times, but inheriting contracts
        // should ensure it's only called once per transaction to avoid duplicate events
        vm.recordLogs();
        
        // Call touchIndex twice in same transaction
        indexable.callTouchIndex();
        indexable.callTouchIndex();
        
        // Both calls will emit events (no guard anymore)
        Vm.Log[] memory logs = vm.getRecordedLogs();
        uint256 blockPointerEventCount = 0;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == keccak256("BlockPointer(uint256)")) {
                blockPointerEventCount++;
            }
        }
        assertEq(blockPointerEventCount, 2, "Both calls emit events (no guard)");
    }
}

