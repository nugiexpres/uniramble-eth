// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GameCaveatEnforcer
 * @dev Enhanced implementation of ICaveatEnforcer for game delegation restrictions
 * Supports game-specific caveats for roll, rail, buy, faucet, and cook actions
 */
contract BasicCaveatEnforcer is Ownable {
    struct SpendingLimit {
        address token;
        uint256 maxAmount;
        uint256 spentAmount;
        uint256 validUntil;
    }

    struct GameActionLimit {
        uint256 maxRolls;
        uint256 maxBuys;
        uint256 maxRails;
        uint256 maxFaucets;
        uint256 maxCooks;
        uint256 usedRolls;
        uint256 usedBuys;
        uint256 usedRails;
        uint256 usedFaucets;
        uint256 usedCooks;
        uint256 validUntil;
    }

    struct RateLimit {
        uint256 maxCallsPerHour;
        uint256 lastResetTime;
        uint256 callsThisHour;
    }

    // Existing mappings
    mapping(bytes32 => SpendingLimit) public spendingLimits;
    mapping(bytes32 => bool) public allowedTargets;
    mapping(bytes32 => uint256) public validUntil;

    // New game-specific mappings
    mapping(bytes32 => GameActionLimit) public gameActionLimits;
    mapping(bytes32 => RateLimit) public rateLimits;
    mapping(bytes32 => mapping(bytes4 => bool)) public allowedFunctions; // delegationHash => functionSelector => allowed
    mapping(bytes32 => address[]) public allowedTargetAddresses; // delegationHash => target addresses

    // Events
    event SpendingLimitSet(bytes32 indexed delegationHash, address token, uint256 maxAmount, uint256 validUntil);
    event TargetAllowed(bytes32 indexed delegationHash, address target);
    event TimeLimitSet(bytes32 indexed delegationHash, uint256 validUntil);
    event GameActionLimitSet(
        bytes32 indexed delegationHash,
        uint256 maxRolls,
        uint256 maxBuys,
        uint256 maxRails,
        uint256 maxFaucets,
        uint256 maxCooks,
        uint256 validUntil
    );
    event RateLimitSet(bytes32 indexed delegationHash, uint256 maxCallsPerHour);
    event FunctionAllowed(bytes32 indexed delegationHash, bytes4 functionSelector, bool allowed);
    event TargetAddressesSet(bytes32 indexed delegationHash, address[] targets);

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
        } else if (keccak256(bytes(caveatType)) == keccak256(bytes("gameActionLimit"))) {
            _enforceGameActionLimit(caveatData, delegationHash, executionCalldata);
        } else if (keccak256(bytes(caveatType)) == keccak256(bytes("rateLimit"))) {
            _enforceRateLimit(delegationHash);
        } else if (keccak256(bytes(caveatType)) == keccak256(bytes("allowedFunctions"))) {
            _enforceAllowedFunctions(caveatData, delegationHash, executionCalldata);
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
        } else if (keccak256(bytes(caveatType)) == keccak256(bytes("gameActionLimit"))) {
            _updateGameActionUsage(caveatData, delegationHash, executionCalldata);
        } else if (keccak256(bytes(caveatType)) == keccak256(bytes("rateLimit"))) {
            _updateRateLimit(delegationHash);
        }
    }

    /**
     * @dev Sets spending limit for a delegation
     * Anyone can set limits for their own delegations
     */
    function setSpendingLimit(
        bytes32 delegationHash,
        address token,
        uint256 maxAmount,
        uint256 validUntilTime
    ) external {
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
     * Anyone can set targets for their own delegations
     */
    function setAllowedTarget(bytes32 delegationHash, address target) external {
        allowedTargets[keccak256(abi.encodePacked(delegationHash, target))] = true;
        emit TargetAllowed(delegationHash, target);
    }

    /**
     * @dev Sets time limit for a delegation
     * Anyone can set time limits for their own delegations
     */
    function setTimeLimit(bytes32 delegationHash, uint256 validUntilTime) external {
        validUntil[delegationHash] = validUntilTime;
        emit TimeLimitSet(delegationHash, validUntilTime);
    }

    /**
     * @dev Sets game action limits for a delegation
     * Anyone can set game limits for their own delegations
     */
    function setGameActionLimit(
        bytes32 delegationHash,
        uint256 maxRolls,
        uint256 maxBuys,
        uint256 maxRails,
        uint256 maxFaucets,
        uint256 maxCooks,
        uint256 validUntilTime
    ) external {
        gameActionLimits[delegationHash] = GameActionLimit({
            maxRolls: maxRolls,
            maxBuys: maxBuys,
            maxRails: maxRails,
            maxFaucets: maxFaucets,
            maxCooks: maxCooks,
            usedRolls: 0,
            usedBuys: 0,
            usedRails: 0,
            usedFaucets: 0,
            usedCooks: 0,
            validUntil: validUntilTime
        });

        emit GameActionLimitSet(delegationHash, maxRolls, maxBuys, maxRails, maxFaucets, maxCooks, validUntilTime);
    }

    /**
     * @dev Sets rate limit for a delegation
     * Anyone can set rate limits for their own delegations
     */
    function setRateLimit(bytes32 delegationHash, uint256 maxCallsPerHour) external {
        rateLimits[delegationHash] = RateLimit({
            maxCallsPerHour: maxCallsPerHour,
            lastResetTime: block.timestamp,
            callsThisHour: 0
        });

        emit RateLimitSet(delegationHash, maxCallsPerHour);
    }

    /**
     * @dev Sets allowed function selectors for a delegation
     * Anyone can set function selectors for their own delegations
     */
    function setAllowedFunction(bytes32 delegationHash, bytes4 functionSelector, bool allowed) external {
        allowedFunctions[delegationHash][functionSelector] = allowed;
        emit FunctionAllowed(delegationHash, functionSelector, allowed);
    }

    /**
     * @dev Sets allowed target addresses for a delegation
     * Anyone can set target addresses for their own delegations
     */
    function setAllowedTargetAddresses(bytes32 delegationHash, address[] calldata targets) external {
        allowedTargetAddresses[delegationHash] = targets;
        emit TargetAddressesSet(delegationHash, targets);
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
        bytes memory /* caveatData */,
        bytes32 delegationHash,
        bytes calldata executionCalldata
    ) internal view {
        // Extract target from execution calldata (first 20 bytes)
        require(executionCalldata.length >= 20, "Invalid calldata length");
        address target;
        assembly {
            target := shr(96, calldataload(executionCalldata.offset))
        }

        // Check if target is in the allowed list for this delegation
        address[] memory allowedTargetList = allowedTargetAddresses[delegationHash];
        bool isAllowed = false;

        for (uint256 i = 0; i < allowedTargetList.length; i++) {
            if (allowedTargetList[i] == target) {
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

    /**
     * @dev Enforces game action limits
     */
    function _enforceGameActionLimit(
        bytes memory caveatData,
        bytes32 delegationHash,
        bytes calldata /* executionCalldata */
    ) internal view {
        string memory actionType = abi.decode(caveatData, (string));
        GameActionLimit memory limit = gameActionLimits[delegationHash];

        require(limit.validUntil > block.timestamp, "Game action limit expired");

        if (keccak256(bytes(actionType)) == keccak256(bytes("roll"))) {
            require(limit.usedRolls < limit.maxRolls, "Roll limit exceeded");
        } else if (keccak256(bytes(actionType)) == keccak256(bytes("buy"))) {
            require(limit.usedBuys < limit.maxBuys, "Buy limit exceeded");
        } else if (keccak256(bytes(actionType)) == keccak256(bytes("rail"))) {
            require(limit.usedRails < limit.maxRails, "Rail limit exceeded");
        } else if (keccak256(bytes(actionType)) == keccak256(bytes("faucet"))) {
            require(limit.usedFaucets < limit.maxFaucets, "Faucet limit exceeded");
        } else if (keccak256(bytes(actionType)) == keccak256(bytes("cook"))) {
            require(limit.usedCooks < limit.maxCooks, "Cook limit exceeded");
        }
    }

    /**
     * @dev Enforces rate limiting
     */
    function _enforceRateLimit(bytes32 delegationHash) internal view {
        RateLimit memory limit = rateLimits[delegationHash];

        // Reset counter if an hour has passed
        if (block.timestamp >= limit.lastResetTime + 1 hours) {
            // This will be handled in afterHook
            return;
        }

        require(limit.callsThisHour < limit.maxCallsPerHour, "Rate limit exceeded");
    }

    /**
     * @dev Enforces allowed functions
     */
    function _enforceAllowedFunctions(
        bytes memory caveatData,
        bytes32 /* delegationHash */,
        bytes calldata executionCalldata
    ) internal pure {
        bytes4[] memory allowedSelectors = abi.decode(caveatData, (bytes4[]));

        // Extract function selector from calldata (first 4 bytes)
        require(executionCalldata.length >= 4, "Invalid calldata length");
        bytes4 selector;
        assembly {
            selector := shr(224, calldataload(executionCalldata.offset))
        }

        bool isAllowed = false;
        for (uint256 i = 0; i < allowedSelectors.length; i++) {
            if (allowedSelectors[i] == selector) {
                isAllowed = true;
                break;
            }
        }
        require(isAllowed, "Function not allowed");
    }

    /**
     * @dev Updates game action usage after execution
     */
    function _updateGameActionUsage(
        bytes memory caveatData,
        bytes32 delegationHash,
        bytes calldata /* executionCalldata */
    ) internal {
        string memory actionType = abi.decode(caveatData, (string));
        GameActionLimit storage limit = gameActionLimits[delegationHash];

        if (keccak256(bytes(actionType)) == keccak256(bytes("roll"))) {
            limit.usedRolls++;
        } else if (keccak256(bytes(actionType)) == keccak256(bytes("buy"))) {
            limit.usedBuys++;
        } else if (keccak256(bytes(actionType)) == keccak256(bytes("rail"))) {
            limit.usedRails++;
        } else if (keccak256(bytes(actionType)) == keccak256(bytes("faucet"))) {
            limit.usedFaucets++;
        } else if (keccak256(bytes(actionType)) == keccak256(bytes("cook"))) {
            limit.usedCooks++;
        }
    }

    /**
     * @dev Updates rate limit after execution
     */
    function _updateRateLimit(bytes32 delegationHash) internal {
        RateLimit storage limit = rateLimits[delegationHash];

        // Reset counter if an hour has passed
        if (block.timestamp >= limit.lastResetTime + 1 hours) {
            limit.lastResetTime = block.timestamp;
            limit.callsThisHour = 1;
        } else {
            limit.callsThisHour++;
        }
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
