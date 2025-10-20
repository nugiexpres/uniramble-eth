// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GameCaveatEnforcer
 * @dev Caveat enforcer specifically for game actions (roll, rail, buy, faucet, cook)
 * Implements ICaveatEnforcer interface for MetaMask delegation toolkit compatibility
 */
contract GameCaveatEnforcer is Ownable {
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

    struct GameState {
        bool isActive;
        uint256 lastActionTime;
        uint256 consecutiveActions;
        uint256 maxConsecutiveActions;
    }

    // Mappings
    mapping(bytes32 => GameActionLimit) public gameActionLimits;
    mapping(bytes32 => RateLimit) public rateLimits;
    mapping(bytes32 => GameState) public gameStates;
    mapping(bytes32 => mapping(bytes4 => bool)) public allowedFunctions;
    mapping(bytes32 => address[]) public allowedTargetAddresses;
    mapping(bytes32 => mapping(string => bool)) public allowedGameActions;

    // Game action function selectors
    bytes4 public constant MOVE_PLAYER_SELECTOR = 0x12345678; // movePlayer()
    bytes4 public constant BUY_INGREDIENT_SELECTOR = 0x87654321; // buyIngredient()
    bytes4 public constant TRAVEL_RAIL_SELECTOR = 0x11223344; // travelRail()
    bytes4 public constant USE_FAUCET_SELECTOR = 0x44332211; // useFaucetMon()
    bytes4 public constant MINT_FOOD_NFT_SELECTOR = 0x55667788; // mintFoodNFT()

    // Events
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
    event GameStateSet(bytes32 indexed delegationHash, bool isActive, uint256 maxConsecutiveActions);
    event FunctionAllowed(bytes32 indexed delegationHash, bytes4 functionSelector, bool allowed);
    event TargetAddressesSet(bytes32 indexed delegationHash, address[] targets);
    event GameActionAllowed(bytes32 indexed delegationHash, string action, bool allowed);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Set game action limits for a delegation
     * Anyone can set limits for their own delegations
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
     * @dev Set rate limit for a delegation
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
     * @dev Set game state for a delegation
     * Anyone can set game state for their own delegations
     */
    function setGameState(bytes32 delegationHash, bool isActive, uint256 maxConsecutiveActions) external {
        gameStates[delegationHash] = GameState({
            isActive: isActive,
            lastActionTime: 0,
            consecutiveActions: 0,
            maxConsecutiveActions: maxConsecutiveActions
        });

        emit GameStateSet(delegationHash, isActive, maxConsecutiveActions);
    }

    /**
     * @dev Set allowed function selectors for a delegation
     * Anyone can set function selectors for their own delegations
     */
    function setAllowedFunction(bytes32 delegationHash, bytes4 functionSelector, bool allowed) external {
        allowedFunctions[delegationHash][functionSelector] = allowed;
        emit FunctionAllowed(delegationHash, functionSelector, allowed);
    }

    /**
     * @dev Set allowed target addresses for a delegation
     * Anyone can set target addresses for their own delegations
     */
    function setAllowedTargetAddresses(bytes32 delegationHash, address[] calldata targets) external {
        allowedTargetAddresses[delegationHash] = targets;
        emit TargetAddressesSet(delegationHash, targets);
    }

    /**
     * @dev Set allowed game actions for a delegation
     * Anyone can set game actions for their own delegations
     */
    function setAllowedGameAction(bytes32 delegationHash, string calldata action, bool allowed) external {
        allowedGameActions[delegationHash][action] = allowed;
        emit GameActionAllowed(delegationHash, action, allowed);
    }

    /**
     * @dev Set default game configuration for a delegation
     * Anyone can set default config for their own delegations
     */
    function setDefaultGameConfig(bytes32 delegationHash) external {
        // Set default limits (100 of each action per day)
        gameActionLimits[delegationHash] = GameActionLimit({
            maxRolls: 100,
            maxBuys: 100,
            maxRails: 100,
            maxFaucets: 100,
            maxCooks: 100,
            usedRolls: 0,
            usedBuys: 0,
            usedRails: 0,
            usedFaucets: 0,
            usedCooks: 0,
            validUntil: block.timestamp + 1 days
        });

        // Set default rate limit (50 calls per hour)
        rateLimits[delegationHash] = RateLimit({
            maxCallsPerHour: 50,
            lastResetTime: block.timestamp,
            callsThisHour: 0
        });

        // Set default game state (active, max 10 consecutive actions)
        gameStates[delegationHash] = GameState({
            isActive: true,
            lastActionTime: 0,
            consecutiveActions: 0,
            maxConsecutiveActions: 10
        });

        // Set allowed functions
        allowedFunctions[delegationHash][MOVE_PLAYER_SELECTOR] = true;
        allowedFunctions[delegationHash][BUY_INGREDIENT_SELECTOR] = true;
        allowedFunctions[delegationHash][TRAVEL_RAIL_SELECTOR] = true;
        allowedFunctions[delegationHash][USE_FAUCET_SELECTOR] = true;
        allowedFunctions[delegationHash][MINT_FOOD_NFT_SELECTOR] = true;

        // Set allowed game actions
        allowedGameActions[delegationHash]["roll"] = true;
        allowedGameActions[delegationHash]["buy"] = true;
        allowedGameActions[delegationHash]["rail"] = true;
        allowedGameActions[delegationHash]["faucet"] = true;
        allowedGameActions[delegationHash]["cook"] = true;
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

        if (keccak256(bytes(caveatType)) == keccak256(bytes("gameActionLimit"))) {
            _enforceGameActionLimit(caveatData, delegationHash);
        } else if (keccak256(bytes(caveatType)) == keccak256(bytes("rateLimit"))) {
            _enforceRateLimit(delegationHash);
        } else if (keccak256(bytes(caveatType)) == keccak256(bytes("gameState"))) {
            _enforceGameState(delegationHash);
        } else if (keccak256(bytes(caveatType)) == keccak256(bytes("allowedFunctions"))) {
            _enforceAllowedFunctions(caveatData, delegationHash, executionCalldata);
        } else if (keccak256(bytes(caveatType)) == keccak256(bytes("allowedTargets"))) {
            _enforceAllowedTargets(delegationHash, executionCalldata);
        } else if (keccak256(bytes(caveatType)) == keccak256(bytes("allowedGameActions"))) {
            _enforceAllowedGameActions(caveatData, delegationHash);
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

        if (keccak256(bytes(caveatType)) == keccak256(bytes("gameActionLimit"))) {
            _updateGameActionUsage(caveatData, delegationHash, executionCalldata);
        } else if (keccak256(bytes(caveatType)) == keccak256(bytes("rateLimit"))) {
            _updateRateLimit(delegationHash);
        } else if (keccak256(bytes(caveatType)) == keccak256(bytes("gameState"))) {
            _updateGameState(delegationHash);
        }
    }

    /**
     * @dev Enforce game action limits
     */
    function _enforceGameActionLimit(bytes memory caveatData, bytes32 delegationHash) internal view {
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
     * @dev Enforce rate limiting
     */
    function _enforceRateLimit(bytes32 delegationHash) internal view {
        RateLimit memory limit = rateLimits[delegationHash];

        // Reset counter if an hour has passed
        if (block.timestamp >= limit.lastResetTime + 1 hours) {
            return; // Will be handled in afterHook
        }

        require(limit.callsThisHour < limit.maxCallsPerHour, "Rate limit exceeded");
    }

    /**
     * @dev Enforce game state
     */
    function _enforceGameState(bytes32 delegationHash) internal view {
        GameState memory state = gameStates[delegationHash];
        require(state.isActive, "Game session not active");
        require(state.consecutiveActions < state.maxConsecutiveActions, "Max consecutive actions exceeded");
    }

    /**
     * @dev Enforce allowed functions
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
     * @dev Enforce allowed targets
     */
    function _enforceAllowedTargets(bytes32 delegationHash, bytes calldata executionCalldata) internal view {
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
     * @dev Enforce allowed game actions
     */
    function _enforceAllowedGameActions(bytes memory caveatData, bytes32 delegationHash) internal view {
        string memory actionType = abi.decode(caveatData, (string));
        require(allowedGameActions[delegationHash][actionType], "Game action not allowed");
    }

    /**
     * @dev Update game action usage after execution
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
     * @dev Update rate limit after execution
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

    /**
     * @dev Update game state after execution
     */
    function _updateGameState(bytes32 delegationHash) internal {
        GameState storage state = gameStates[delegationHash];

        // Reset consecutive actions if more than 5 minutes have passed
        if (block.timestamp >= state.lastActionTime + 5 minutes) {
            state.consecutiveActions = 1;
        } else {
            state.consecutiveActions++;
        }

        state.lastActionTime = block.timestamp;
    }

    /**
     * @dev Get game action limits for a delegation
     */
    function getGameActionLimits(bytes32 delegationHash) external view returns (GameActionLimit memory) {
        return gameActionLimits[delegationHash];
    }

    /**
     * @dev Get rate limit for a delegation
     */
    function getRateLimit(bytes32 delegationHash) external view returns (RateLimit memory) {
        return rateLimits[delegationHash];
    }

    /**
     * @dev Get game state for a delegation
     */
    function getGameState(bytes32 delegationHash) external view returns (GameState memory) {
        return gameStates[delegationHash];
    }
}
