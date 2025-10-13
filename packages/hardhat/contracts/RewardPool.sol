// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// ==================== REWARD POOL CONTRACT ====================
contract RewardPool is Ownable, ReentrancyGuard {
    mapping(address => bool) public authorizedDistributors;
    uint256 public totalDistributed;

    event RewardDistributed(address indexed to, uint256 amount, address indexed distributor);
    event FundsDeposited(address indexed from, uint256 amount);
    event DistributorUpdated(address indexed distributor, bool authorized);

    modifier onlyDistributor() {
        require(authorizedDistributors[msg.sender], "Not authorized distributor");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Deposit funds to the reward pool
     */
    function deposit() external payable {
        require(msg.value > 0, "Must send ETH");
        emit FundsDeposited(msg.sender, msg.value);
    }

    /**
     * @dev Distribute reward to player
     */
    function distributeReward(address to, uint256 amount) external onlyDistributor nonReentrant {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= amount, "Insufficient pool balance");

        totalDistributed += amount;

        (bool success, ) = payable(to).call{ value: amount }("");
        require(success, "Transfer failed");

        emit RewardDistributed(to, amount, msg.sender);
    }

    /**
     * @dev Get current pool balance
     */
    function getPoolBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Set authorized distributor
     */
    function setDistributor(address distributor, bool authorized) external onlyOwner {
        authorizedDistributors[distributor] = authorized;
        emit DistributorUpdated(distributor, authorized);
    }

    /**
     * @dev Emergency withdraw
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner()).call{ value: balance }("");
        require(success, "Withdrawal failed");
    }

    // Allow contract to receive ETH
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }
}
