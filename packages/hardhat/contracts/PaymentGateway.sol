// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// PaymentGateway refactored for OpenZeppelin Contracts v5 compatibility
// - Uses SafeERC20 for ERC20 transfers
// - Uses Ownable + ReentrancyGuard
// - No Counters dependency
// - Pull-over-push pattern for owner withdrawals

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PaymentGateway is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Events
    event NativePaymentReceived(address indexed payer, uint256 amount, bytes metadata);
    event ERC20PaymentReceived(address indexed payer, address indexed token, uint256 amount, bytes metadata);
    event Withdrawn(address indexed receiver, uint256 amount);
    event ERC20Withdrawn(address indexed token, address indexed receiver, uint256 amount);

    constructor() Ownable(msg.sender) {}

    // Receive native ETH/AVAX/BNB/etc payments with optional metadata (use low-level call to pass data off-chain)
    receive() external payable {
        emit NativePaymentReceived(msg.sender, msg.value, "");
    }

    // Fallback to accept plain payments
    fallback() external payable {
        emit NativePaymentReceived(msg.sender, msg.value, "");
    }

    /**
     * @dev Pay with native token and attach optional metadata (ABI-encoded bytes)
     */
    function payNative(bytes calldata metadata) external payable nonReentrant {
        require(msg.value > 0, "PaymentGateway: zero payment");
        emit NativePaymentReceived(msg.sender, msg.value, metadata);
    }

    /**
     * @dev Pay with ERC20 token. Caller must approve this contract beforehand.
     */
    function payERC20(address token, uint256 amount, bytes calldata metadata) external nonReentrant {
        require(amount > 0, "PaymentGateway: zero amount");
        require(token != address(0), "PaymentGateway: invalid token");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit ERC20PaymentReceived(msg.sender, token, amount, metadata);
    }

    /**
     * @dev Owner withdraw native balance to a receiver
     */
    function withdrawNative(address payable receiver, uint256 amount) external onlyOwner nonReentrant {
        require(receiver != address(0), "PaymentGateway: invalid receiver");
        require(amount <= address(this).balance, "PaymentGateway: insufficient balance");

        (bool sent, ) = receiver.call{ value: amount }("");
        require(sent, "PaymentGateway: native transfer failed");

        emit Withdrawn(receiver, amount);
    }

    /**
     * @dev Owner withdraw ERC20 token balance to a receiver
     */
    function withdrawERC20(address token, address receiver, uint256 amount) external onlyOwner nonReentrant {
        require(receiver != address(0), "PaymentGateway: invalid receiver");
        require(token != address(0), "PaymentGateway: invalid token");

        IERC20(token).safeTransfer(receiver, amount);
        emit ERC20Withdrawn(token, receiver, amount);
    }

    /**
     * @dev Emergency rescue for accidentally sent tokens (owner only)
     */
    function rescueERC20(address token, address to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "PaymentGateway: invalid to");
        IERC20(token).safeTransfer(to, amount);
        emit ERC20Withdrawn(token, to, amount);
    }

    /**
     * @dev Get contract native balance
     */
    function nativeBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Get ERC20 balance of contract
     */
    function erc20Balance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    // Add custom logic below (forwarding, split payments, fee calculation, on-chain receipts, etc.)
}
