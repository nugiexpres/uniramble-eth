// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract FaucetMon {
    address public owner;
    address public allowedCaller;

    event BalanceFunded(address indexed funder, uint256 amount);
    event BalanceWithdrawn(address indexed owner, uint256 amount);
    event FaucetUsed(address indexed recipient, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setAllowedCaller(address _caller) external onlyOwner {
        allowedCaller = _caller;
    }

    function faucet(address to, uint256 amount) external {
        require(msg.sender == allowedCaller, "Caller not set");
        require(address(this).balance >= amount, "Not enough balance");
        payable(to).transfer(amount);
        emit FaucetUsed(to, amount);
    }

    // Function to fund the faucet balance
    function fundFaucet() external payable {
        require(msg.value > 0, "Must send native token to fund the faucet");
        emit BalanceFunded(msg.sender, msg.value);
    }

    // Function to withdraw the faucet balance (only owner)
    function withdrawBalance(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance in the faucet");
        payable(owner).transfer(amount);
        emit BalanceWithdrawn(owner, amount);
    }

    // Allow the contract to receive Ether
    receive() external payable {}
}
