// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FinancialCaveatEnforcer
 * @dev Wrapper for MetaMask's built-in financial caveat enforcers
 * Provides a unified interface for financial restrictions (spending limits, token transfers, etc.)
 */
contract FinancialCaveatEnforcer is Ownable {
    struct SpendingLimit {
        address token;
        uint256 maxAmount;
        uint256 spentAmount;
        uint256 validUntil;
        uint256 periodLength; // For period-based limits
        uint256 currentPeriod;
    }

    struct TransferLimit {
        address token;
        uint256 maxTransferAmount;
        uint256 dailyLimit;
        uint256 usedToday;
        uint256 lastResetDay;
    }

    // Mappings
    mapping(bytes32 => SpendingLimit) public spendingLimits;
    mapping(bytes32 => TransferLimit) public transferLimits;
    mapping(bytes32 => uint256) public timeLimits;
    mapping(bytes32 => address[]) public allowedTokens;
    mapping(bytes32 => mapping(address => bool)) public tokenWhitelist;

    // Events
    event SpendingLimitSet(
        bytes32 indexed delegationHash,
        address indexed token,
        uint256 maxAmount,
        uint256 validUntil,
        uint256 periodLength
    );
    event TransferLimitSet(
        bytes32 indexed delegationHash,
        address indexed token,
        uint256 maxTransferAmount,
        uint256 dailyLimit
    );
    event TimeLimitSet(bytes32 indexed delegationHash, uint256 validUntil);
    event TokenWhitelistSet(bytes32 indexed delegationHash, address[] tokens);
    event TokenSpent(bytes32 indexed delegationHash, address indexed token, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Set spending limit for a delegation
     * Anyone can set spending limits for their own delegations
     */
    function setSpendingLimit(
        bytes32 delegationHash,
        address token,
        uint256 maxAmount,
        uint256 validUntilTime,
        uint256 periodLengthSeconds
    ) external {
        spendingLimits[delegationHash] = SpendingLimit({
            token: token,
            maxAmount: maxAmount,
            spentAmount: 0,
            validUntil: validUntilTime,
            periodLength: periodLengthSeconds,
            currentPeriod: block.timestamp / periodLengthSeconds
        });

        emit SpendingLimitSet(delegationHash, token, maxAmount, validUntilTime, periodLengthSeconds);
    }

    /**
     * @dev Set transfer limit for a delegation
     * Anyone can set transfer limits for their own delegations
     */
    function setTransferLimit(
        bytes32 delegationHash,
        address token,
        uint256 maxTransferAmount,
        uint256 dailyLimit
    ) external {
        transferLimits[delegationHash] = TransferLimit({
            token: token,
            maxTransferAmount: maxTransferAmount,
            dailyLimit: dailyLimit,
            usedToday: 0,
            lastResetDay: block.timestamp / 1 days
        });

        emit TransferLimitSet(delegationHash, token, maxTransferAmount, dailyLimit);
    }

    /**
     * @dev Set time limit for a delegation
     * Anyone can set time limits for their own delegations
     */
    function setTimeLimit(bytes32 delegationHash, uint256 validUntilTime) external {
        timeLimits[delegationHash] = validUntilTime;
        emit TimeLimitSet(delegationHash, validUntilTime);
    }

    /**
     * @dev Set token whitelist for a delegation
     * Anyone can set token whitelist for their own delegations
     */
    function setTokenWhitelist(bytes32 delegationHash, address[] calldata tokens) external {
        allowedTokens[delegationHash] = tokens;

        // Clear existing whitelist
        for (uint256 i = 0; i < allowedTokens[delegationHash].length; i++) {
            tokenWhitelist[delegationHash][allowedTokens[delegationHash][i]] = false;
        }

        // Set new whitelist
        for (uint256 i = 0; i < tokens.length; i++) {
            tokenWhitelist[delegationHash][tokens[i]] = true;
        }

        emit TokenWhitelistSet(delegationHash, tokens);
    }

    /**
     * @dev Set default financial configuration for a delegation
     * Anyone can set default config for their own delegations
     */
    function setDefaultFinancialConfig(bytes32 delegationHash) external {
        // Set default spending limit (1 ETH per day)
        spendingLimits[delegationHash] = SpendingLimit({
            token: address(0),
            maxAmount: 1 ether,
            spentAmount: 0,
            validUntil: block.timestamp + 30 days,
            periodLength: 1 days,
            currentPeriod: block.timestamp / 1 days
        });

        // Set default time limit (30 days)
        timeLimits[delegationHash] = block.timestamp + 30 days;

        // Set default token whitelist (native token only)
        address[] memory defaultTokens = new address[](1);
        defaultTokens[0] = address(0); // Native token

        // Clear existing whitelist
        for (uint256 i = 0; i < allowedTokens[delegationHash].length; i++) {
            tokenWhitelist[delegationHash][allowedTokens[delegationHash][i]] = false;
        }

        // Set new whitelist
        allowedTokens[delegationHash] = defaultTokens;
        for (uint256 i = 0; i < defaultTokens.length; i++) {
            tokenWhitelist[delegationHash][defaultTokens[i]] = true;
        }
    }

    /**
     * @dev ICaveatEnforcer beforeHook implementation
     */
    function beforeHook(
        bytes calldata terms,
        bytes calldata /* args */,
        uint256 /* mode */,
        bytes calldata executionCalldata,
        bytes32 delegationHash
    ) external view {
        // Decode terms to get caveat type
        (string memory caveatType, bytes memory caveatData) = abi.decode(terms, (string, bytes));

        if (keccak256(bytes(caveatType)) == keccak256(bytes("spendingLimit"))) {
            _enforceSpendingLimit(caveatData, delegationHash);
        } else if (keccak256(bytes(caveatType)) == keccak256(bytes("transferLimit"))) {
            _enforceTransferLimit(caveatData, delegationHash);
        } else if (keccak256(bytes(caveatType)) == keccak256(bytes("timeLimit"))) {
            _enforceTimeLimit(caveatData, delegationHash);
        } else if (keccak256(bytes(caveatType)) == keccak256(bytes("tokenWhitelist"))) {
            _enforceTokenWhitelist(caveatData, delegationHash, executionCalldata);
        }
    }

    /**
     * @dev ICaveatEnforcer afterHook implementation
     */
    function afterHook(
        bytes calldata terms,
        bytes calldata /* args */,
        uint256 /* mode */,
        bytes calldata executionCalldata,
        bytes32 delegationHash
    ) external {
        // Decode terms to get caveat type
        (string memory caveatType, bytes memory caveatData) = abi.decode(terms, (string, bytes));

        if (keccak256(bytes(caveatType)) == keccak256(bytes("spendingLimit"))) {
            _updateSpendingAmount(caveatData, delegationHash, executionCalldata);
        } else if (keccak256(bytes(caveatType)) == keccak256(bytes("transferLimit"))) {
            _updateTransferUsage(caveatData, delegationHash, executionCalldata);
        }
    }

    /**
     * @dev Enforce spending limit
     */
    function _enforceSpendingLimit(bytes memory caveatData, bytes32 delegationHash) internal view {
        (address token, uint256 amount) = abi.decode(caveatData, (address, uint256));

        SpendingLimit memory limit = spendingLimits[delegationHash];
        require(limit.token == token, "Token mismatch");
        require(limit.validUntil > block.timestamp, "Spending limit expired");

        // Check if we need to reset for new period
        uint256 currentPeriod = block.timestamp / limit.periodLength;
        if (currentPeriod > limit.currentPeriod) {
            // New period, spending resets
            require(amount <= limit.maxAmount, "Spending limit exceeded");
        } else {
            // Same period, check cumulative spending
            require(limit.spentAmount + amount <= limit.maxAmount, "Spending limit exceeded");
        }
    }

    /**
     * @dev Enforce transfer limit
     */
    function _enforceTransferLimit(bytes memory caveatData, bytes32 delegationHash) internal view {
        (address token, uint256 amount) = abi.decode(caveatData, (address, uint256));

        TransferLimit memory limit = transferLimits[delegationHash];
        require(limit.token == token, "Token mismatch");
        require(amount <= limit.maxTransferAmount, "Transfer amount exceeds limit");

        // Check daily limit
        uint256 currentDay = block.timestamp / 1 days;
        if (currentDay > limit.lastResetDay) {
            // New day, daily usage resets
            require(amount <= limit.dailyLimit, "Daily transfer limit exceeded");
        } else {
            // Same day, check cumulative usage
            require(limit.usedToday + amount <= limit.dailyLimit, "Daily transfer limit exceeded");
        }
    }

    /**
     * @dev Enforce time limit
     */
    function _enforceTimeLimit(bytes memory caveatData, bytes32 /* delegationHash */) internal view {
        uint256 validUntilTime = abi.decode(caveatData, (uint256));
        require(block.timestamp <= validUntilTime, "Delegation expired");
    }

    /**
     * @dev Enforce token whitelist
     */
    function _enforceTokenWhitelist(
        bytes memory caveatData,
        bytes32 delegationHash,
        bytes calldata executionCalldata
    ) internal view {
        address[] memory tokens = abi.decode(caveatData, (address[]));

        // Extract target from execution calldata (first 20 bytes)
        require(executionCalldata.length >= 20, "Invalid calldata length");
        address target;
        assembly {
            target := shr(96, calldataload(executionCalldata.offset))
        }

        // Check if target is in the whitelist
        bool isAllowed = false;
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == target || tokenWhitelist[delegationHash][tokens[i]]) {
                isAllowed = true;
                break;
            }
        }
        require(isAllowed, "Token not in whitelist");
    }

    /**
     * @dev Update spent amount after execution
     */
    function _updateSpendingAmount(
        bytes memory caveatData,
        bytes32 delegationHash,
        bytes calldata /* executionCalldata */
    ) internal {
        (, uint256 amount) = abi.decode(caveatData, (address, uint256));

        SpendingLimit storage limit = spendingLimits[delegationHash];

        // Check if we need to reset for new period
        uint256 currentPeriod = block.timestamp / limit.periodLength;
        if (currentPeriod > limit.currentPeriod) {
            // New period, reset spending
            limit.currentPeriod = currentPeriod;
            limit.spentAmount = amount;
        } else {
            // Same period, add to existing spending
            limit.spentAmount += amount;
        }

        emit TokenSpent(delegationHash, limit.token, amount);
    }

    /**
     * @dev Update transfer usage after execution
     */
    function _updateTransferUsage(
        bytes memory caveatData,
        bytes32 delegationHash,
        bytes calldata /* executionCalldata */
    ) internal {
        (, uint256 amount) = abi.decode(caveatData, (address, uint256));

        TransferLimit storage limit = transferLimits[delegationHash];

        // Check if we need to reset for new day
        uint256 currentDay = block.timestamp / 1 days;
        if (currentDay > limit.lastResetDay) {
            // New day, reset daily usage
            limit.lastResetDay = currentDay;
            limit.usedToday = amount;
        } else {
            // Same day, add to existing usage
            limit.usedToday += amount;
        }
    }

    /**
     * @dev Get spending limit for a delegation
     */
    function getSpendingLimit(bytes32 delegationHash) external view returns (SpendingLimit memory) {
        return spendingLimits[delegationHash];
    }

    /**
     * @dev Get transfer limit for a delegation
     */
    function getTransferLimit(bytes32 delegationHash) external view returns (TransferLimit memory) {
        return transferLimits[delegationHash];
    }

    /**
     * @dev Get time limit for a delegation
     */
    function getTimeLimit(bytes32 delegationHash) external view returns (uint256) {
        return timeLimits[delegationHash];
    }

    /**
     * @dev Get allowed tokens for a delegation
     */
    function getAllowedTokens(bytes32 delegationHash) external view returns (address[] memory) {
        return allowedTokens[delegationHash];
    }

    /**
     * @dev Check if token is whitelisted for a delegation
     */
    function isTokenWhitelisted(bytes32 delegationHash, address token) external view returns (bool) {
        return tokenWhitelist[delegationHash][token];
    }
}
