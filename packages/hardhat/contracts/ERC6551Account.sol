// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./lib/ERC6551BytecodeLib.sol";
import "./interfaces/IERC6551Account.sol";

/// @title ERC-6551 Smart Account (TBA) for NFT-based ownership & Alchemy AA compatible
contract ERC6551Account is IERC165, IERC1271, IERC6551Account, IERC721Receiver, ReentrancyGuard {
    uint256 private _nonce;

    event Withdraw(address indexed owner, uint256 amount);
    event NFTReceived(address indexed operator, address indexed from, uint256 indexed tokenId, bytes data);

    /// @notice Executes a call on behalf of the account
    /// @param to Target contract address
    /// @param value ETH to send
    /// @param data Call data
    function executeCall(
        address to,
        uint256 value,
        bytes calldata data
    ) external payable returns (bytes memory result) {
        require(msg.sender == owner(), "Not token owner");

        bool success;
        (success, result) = to.call{ value: value }(data);

        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }

        _nonce++;
    }

    /// @notice Returns the token that owns this account
    function token() public view returns (uint256 chainId, address tokenContract, uint256 tokenId) {
        uint256 size = address(this).code.length;
        return abi.decode(Bytecode.codeAt(address(this), size - 0x60, size), (uint256, address, uint256));
    }

    /// @notice Returns the owner (current holder of NFT)
    function owner() public view returns (address) {
        (uint256 chainId, address tokenContract, uint256 tokenId) = token();
        if (chainId != block.chainid) return address(0);

        return IERC721(tokenContract).ownerOf(tokenId);
    }

    /// @notice View nonce for replay protection
    function nonce() external view returns (uint256) {
        return _nonce;
    }

    /// @notice EIP-1271 signature validator for contract wallets
    function isValidSignature(
        bytes32 hash,
        bytes memory signature
    ) external view override(IERC1271, IERC6551Account) returns (bytes4 magicValue) {
        bool valid = SignatureChecker.isValidSignatureNow(owner(), hash, signature);
        return valid ? IERC1271.isValidSignature.selector : bytes4(0);
    }

    /// @notice Handle the receipt of an NFT
    /// @param operator The address which called `safeTransferFrom`
    /// @param from The address which previously owned the token
    /// @param tokenId The NFT identifier which is being transferred
    /// @param data Additional data with no specified format
    /// @return bytes4 `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        emit NFTReceived(operator, from, tokenId, data);
        return IERC721Receiver.onERC721Received.selector;
    }

    /// @notice Support introspection for interfaces
    function supportsInterface(bytes4 interfaceId) public pure override returns (bool) {
        return
            interfaceId == type(IERC165).interfaceId ||
            interfaceId == type(IERC1271).interfaceId ||
            interfaceId == type(IERC6551Account).interfaceId ||
            interfaceId == type(IERC721Receiver).interfaceId;
    }

    /// @notice Withdraw native tokens (e.g. MON/ETH) from this TBA to NFT holder EOA
    /// @dev Only NFT owner can call
    function withdraw(uint256 amount) external nonReentrant {
        address _owner = owner();
        require(msg.sender == _owner, "Not token owner");
        require(address(this).balance >= amount, "Insufficient balance");

        (bool sent, ) = _owner.call{ value: amount }("");
        require(sent, "Withdraw failed");

        emit Withdraw(_owner, amount);
    }

    receive() external payable {}
}
