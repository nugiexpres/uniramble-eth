//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TomatoToken is ERC20, Ownable {
    address public gameContract;

    constructor() ERC20("Tomato", "TM") Ownable(msg.sender) {}

    function setGameContract(address _gameContract) external onlyOwner {
        gameContract = _gameContract;
    }

    /// @notice Mint token Tomato
    function mint(address account, uint256 amount) external {
        require(msg.sender == gameContract, "Only game contract can mint");

        // mint token ke user
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external {
        _burn(account, amount);
    }
}
