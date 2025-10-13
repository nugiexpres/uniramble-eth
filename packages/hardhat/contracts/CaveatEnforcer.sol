// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BasicCaveatEnforcer
 * @dev Basic implementation of ICaveatEnforcer for delegation restrictions
 * This is a simplified version - in production you'd use the official MetaMask caveat enforcers
 */
contract BasicCaveatEnforcer is Ownable {
    struct SpendingLimit {
        address token;
        uint256 maxAmount;
        uint256 spentAmount;
        uint256 validUntil;
    }

    mapping(bytes32 => SpendingLimit) public spendingLimits;
    mapping(bytes32 => bool) public allowedTargets;
    mapping(bytes32 => uint256) public validUntil;

    event SpendingLimitSet(bytes32 indexed delegationHash, address token, uint256 maxAmount, uint256 validUntil);
    event TargetAllowed(bytes32 indexed delegationHash, address target);
    event TimeLimitSet(bytes32 indexed delegationHash, uint256 validUntil);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Enforces conditions before execution
     */
    function beforeHook(
        bytes calldata terms,
        bytes calldata /* args */,
        uint256 /* mode */,
        bytes calldata executionCalldata,
        bytes32 delegationHash
    ) external view {
        // Decode terms based on caveat type
        (string memory caveatType, bytes memory caveatData) = abi.decode(terms, (string, bytes));

        if (keccak256(bytes(caveatType)) == keccak256(bytes("spendingLimit"))) {
            _enforceSpendingLimit(caveatData, delegationHash);
        } else if (keccak256(bytes(caveatType)) == keccak256(bytes("allowedTargets"))) {
            _enforceAllowedTargets(caveatData, delegationHash, executionCalldata);
        } else if (keccak256(bytes(caveatType)) == keccak256(bytes("timeLimit"))) {
            _enforceTimeLimit(caveatData, delegationHash);
        }
    }

    /**
     * @dev Enforces conditions after execution
     */
    function afterHook(
        bytes calldata terms,
        bytes calldata /* args */,
        uint256 /* mode */,
        bytes calldata executionCalldata,
        bytes32 delegationHash
    ) external {
        // Update spent amounts for spending limit caveats
        (string memory caveatType, bytes memory caveatData) = abi.decode(terms, (string, bytes));

        if (keccak256(bytes(caveatType)) == keccak256(bytes("spendingLimit"))) {
            _updateSpendingAmount(caveatData, delegationHash, executionCalldata);
        }
    }

    /**
     * @dev Sets spending limit for a delegation
     */
    function setSpendingLimit(
        bytes32 delegationHash,
        address token,
        uint256 maxAmount,
        uint256 validUntilTime
    ) external onlyOwner {
        spendingLimits[delegationHash] = SpendingLimit({
            token: token,
            maxAmount: maxAmount,
            spentAmount: 0,
            validUntil: validUntilTime
        });

        emit SpendingLimitSet(delegationHash, token, maxAmount, validUntilTime);
    }

    /**
     * @dev Sets allowed target for a delegation
     */
    function setAllowedTarget(bytes32 delegationHash, address target) external onlyOwner {
        allowedTargets[keccak256(abi.encodePacked(delegationHash, target))] = true;
        emit TargetAllowed(delegationHash, target);
    }

    /**
     * @dev Sets time limit for a delegation
     */
    function setTimeLimit(bytes32 delegationHash, uint256 validUntilTime) external onlyOwner {
        validUntil[delegationHash] = validUntilTime;
        emit TimeLimitSet(delegationHash, validUntilTime);
    }

    /**
     * @dev Enforces spending limit
     */
    function _enforceSpendingLimit(bytes memory caveatData, bytes32 delegationHash) internal view {
        (address token, uint256 amount) = abi.decode(caveatData, (address, uint256));

        SpendingLimit memory limit = spendingLimits[delegationHash];
        require(limit.token == token, "Token mismatch");
        require(limit.validUntil > block.timestamp, "Spending limit expired");
        require(limit.spentAmount + amount <= limit.maxAmount, "Spending limit exceeded");
    }

    /**
     * @dev Enforces allowed targets
     */
    function _enforceAllowedTargets(
        bytes memory caveatData,
        bytes32 /* delegationHash */,
        bytes calldata executionCalldata
    ) internal pure {
        address[] memory targets = abi.decode(caveatData, (address[]));

        // Extract target from execution calldata (first 20 bytes)
        require(executionCalldata.length >= 20, "Invalid calldata length");
        address target;
        assembly {
            target := shr(96, calldataload(executionCalldata.offset))
        }

        bool isAllowed = false;
        for (uint256 i = 0; i < targets.length; i++) {
            if (targets[i] == target) {
                isAllowed = true;
                break;
            }
        }
        require(isAllowed, "Target not allowed");
    }

    /**
     * @dev Enforces time limit
     */
    function _enforceTimeLimit(bytes memory caveatData, bytes32 /* delegationHash */) internal view {
        uint256 validUntilTime = abi.decode(caveatData, (uint256));
        require(block.timestamp <= validUntilTime, "Delegation expired");
    }

    /**
     * @dev Updates spent amount after execution
     */
    function _updateSpendingAmount(
        bytes memory caveatData,
        bytes32 delegationHash,
        bytes calldata /* executionCalldata */
    ) internal {
        (, uint256 amount) = abi.decode(caveatData, (address, uint256));

        SpendingLimit storage limit = spendingLimits[delegationHash];
        limit.spentAmount += amount;
    }
}

// Interface that should match ICaveatEnforcer from MetaMask Delegation Toolkit
interface ICaveatEnforcer {
    function beforeHook(
        bytes calldata terms,
        bytes calldata args,
        uint256 mode,
        bytes calldata executionCalldata,
        bytes32 delegationHash
    ) external view;

    function afterHook(
        bytes calldata terms,
        bytes calldata args,
        uint256 mode,
        bytes calldata executionCalldata,
        bytes32 delegationHash
    ) external;
}
