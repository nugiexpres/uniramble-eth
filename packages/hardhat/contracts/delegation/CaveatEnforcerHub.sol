// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";

// Interface for caveat enforcers
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

/**
 * @title CaveatEnforcerHub
 * @dev Hub contract that coordinates multiple caveat enforcers
 * Supports both MetaMask built-in enforcers and custom game enforcers
 */
contract CaveatEnforcerHub is Ownable {
    // Mapping from delegation hash to list of enforcer addresses
    mapping(bytes32 => address[]) public delegationEnforcers;

    // Mapping from enforcer address to enabled status
    mapping(address => bool) public enabledEnforcers;

    // Mapping from enforcer type to default enforcer address
    mapping(string => address) public defaultEnforcers;

    // Events
    event EnforcerAdded(bytes32 indexed delegationHash, address indexed enforcer);
    event EnforcerRemoved(bytes32 indexed delegationHash, address indexed enforcer);
    event EnforcerEnabled(address indexed enforcer, bool enabled);
    event DefaultEnforcerSet(string indexed enforcerType, address indexed enforcer);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Add an enforcer to a delegation
     * Anyone can add enabled enforcers to their own delegations
     */
    function addEnforcerToDelegation(bytes32 delegationHash, address enforcer) external {
        require(enabledEnforcers[enforcer], "Enforcer not enabled");
        require(!_isEnforcerInDelegation(delegationHash, enforcer), "Enforcer already added");

        delegationEnforcers[delegationHash].push(enforcer);
        emit EnforcerAdded(delegationHash, enforcer);
    }

    /**
     * @dev Remove an enforcer from a delegation
     * Anyone can remove enforcers from their own delegations
     */
    function removeEnforcerFromDelegation(bytes32 delegationHash, address enforcer) external {
        address[] storage enforcers = delegationEnforcers[delegationHash];
        for (uint256 i = 0; i < enforcers.length; i++) {
            if (enforcers[i] == enforcer) {
                enforcers[i] = enforcers[enforcers.length - 1];
                enforcers.pop();
                emit EnforcerRemoved(delegationHash, enforcer);
                break;
            }
        }
    }

    /**
     * @dev Enable or disable an enforcer
     */
    function setEnforcerEnabled(address enforcer, bool enabled) external onlyOwner {
        enabledEnforcers[enforcer] = enabled;
        emit EnforcerEnabled(enforcer, enabled);
    }

    /**
     * @dev Set default enforcer for a type
     */
    function setDefaultEnforcer(string calldata enforcerType, address enforcer) external onlyOwner {
        require(enabledEnforcers[enforcer], "Enforcer not enabled");
        defaultEnforcers[enforcerType] = enforcer;
        emit DefaultEnforcerSet(enforcerType, enforcer);
    }

    /**
     * @dev Batch enable multiple enforcers
     */
    function batchEnableEnforcers(address[] calldata enforcers) external onlyOwner {
        for (uint256 i = 0; i < enforcers.length; i++) {
            enabledEnforcers[enforcers[i]] = true;
            emit EnforcerEnabled(enforcers[i], true);
        }
    }

    /**
     * @dev Batch set default enforcers
     */
    function batchSetDefaultEnforcers(
        string[] calldata enforcerTypes,
        address[] calldata enforcers
    ) external onlyOwner {
        require(enforcerTypes.length == enforcers.length, "Length mismatch");
        for (uint256 i = 0; i < enforcerTypes.length; i++) {
            require(enabledEnforcers[enforcers[i]], "Enforcer not enabled");
            defaultEnforcers[enforcerTypes[i]] = enforcers[i];
            emit DefaultEnforcerSet(enforcerTypes[i], enforcers[i]);
        }
    }

    /**
     * @dev Add default enforcers to a delegation
     * Anyone can add default enforcers to their own delegations
     */
    function addDefaultEnforcersToDelegation(
        bytes32 delegationHash,
        string[] calldata enforcerTypes
    ) external {
        for (uint256 i = 0; i < enforcerTypes.length; i++) {
            address enforcer = defaultEnforcers[enforcerTypes[i]];
            if (enforcer != address(0) && !_isEnforcerInDelegation(delegationHash, enforcer)) {
                delegationEnforcers[delegationHash].push(enforcer);
                emit EnforcerAdded(delegationHash, enforcer);
            }
        }
    }

    /**
     * @dev Main beforeHook that coordinates all enforcers
     */
    function beforeHook(
        bytes calldata terms,
        bytes calldata args,
        uint256 mode,
        bytes calldata executionCalldata,
        bytes32 delegationHash
    ) external view {
        address[] memory enforcers = delegationEnforcers[delegationHash];

        for (uint256 i = 0; i < enforcers.length; i++) {
            if (enabledEnforcers[enforcers[i]]) {
                try ICaveatEnforcer(enforcers[i]).beforeHook(terms, args, mode, executionCalldata, delegationHash) {
                    // Enforcer passed, continue to next
                } catch Error(string memory reason) {
                    // Re-throw with context
                    revert(string(abi.encodePacked("Enforcer ", _addressToString(enforcers[i]), " failed: ", reason)));
                } catch {
                    revert("Enforcer execution failed");
                }
            }
        }
    }

    /**
     * @dev Main afterHook that coordinates all enforcers
     */
    function afterHook(
        bytes calldata terms,
        bytes calldata args,
        uint256 mode,
        bytes calldata executionCalldata,
        bytes32 delegationHash
    ) external {
        address[] memory enforcers = delegationEnforcers[delegationHash];

        for (uint256 i = 0; i < enforcers.length; i++) {
            if (enabledEnforcers[enforcers[i]]) {
                try ICaveatEnforcer(enforcers[i]).afterHook(terms, args, mode, executionCalldata, delegationHash) {
                    // Enforcer passed, continue to next
                } catch Error(string memory reason) {
                    // Log error but don't revert (afterHook should be more lenient)
                    emit EnforcerAfterHookFailed(enforcers[i], delegationHash, reason);
                } catch {
                    emit EnforcerAfterHookFailed(enforcers[i], delegationHash, "Unknown error");
                }
            }
        }
    }

    /**
     * @dev Get all enforcers for a delegation
     */
    function getDelegationEnforcers(bytes32 delegationHash) external view returns (address[] memory) {
        return delegationEnforcers[delegationHash];
    }

    /**
     * @dev Check if an enforcer is in a delegation
     */
    function isEnforcerInDelegation(bytes32 delegationHash, address enforcer) external view returns (bool) {
        return _isEnforcerInDelegation(delegationHash, enforcer);
    }

    /**
     * @dev Internal function to check if enforcer is in delegation
     */
    function _isEnforcerInDelegation(bytes32 delegationHash, address enforcer) internal view returns (bool) {
        address[] memory enforcers = delegationEnforcers[delegationHash];
        for (uint256 i = 0; i < enforcers.length; i++) {
            if (enforcers[i] == enforcer) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Convert address to string
     */
    function _addressToString(address addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }

    // Event for afterHook failures
    event EnforcerAfterHookFailed(address indexed enforcer, bytes32 indexed delegationHash, string reason);
}
