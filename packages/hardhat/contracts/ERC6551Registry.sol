// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Create2.sol";
import "./ERC6551AccountProxy.sol";

contract ERC6551Registry {
    error InitializationFailed();

    event AccountCreated(
        address indexed account,
        address indexed implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        uint256 salt
    );

    // Track created accounts to avoid duplicates
    mapping(address => bool) public createdAccounts;
    mapping(bytes32 => bool) public usedCombinations;

    function createAccount(
        address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        uint256 salt,
        bytes calldata initData
    ) external returns (address) {
        bytes memory proxyCode = abi.encodePacked(
            type(ERC6551AccountProxy).creationCode,
            abi.encode(implementation, initData)
        );

        bytes32 combinationHash = keccak256(abi.encode(implementation, chainId, tokenContract, tokenId, salt));
        require(!usedCombinations[combinationHash], "Combination already used");

        address computed = Create2.computeAddress(bytes32(salt), keccak256(proxyCode));
        require(!createdAccounts[computed], "Account already exists");

        address deployed = Create2.deploy(0, bytes32(salt), proxyCode);

        usedCombinations[combinationHash] = true;
        createdAccounts[deployed] = true;

        emit AccountCreated(deployed, implementation, chainId, tokenContract, tokenId, salt);

        return deployed;
    }

    function account(
        address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        uint256 salt
    ) external view returns (address) {
        bytes memory initData = abi.encode(chainId, tokenContract, tokenId);
        bytes memory proxyCode = abi.encodePacked(
            type(ERC6551AccountProxy).creationCode,
            abi.encode(implementation, initData)
        );

        return Create2.computeAddress(bytes32(salt), keccak256(proxyCode));
    }
}
