// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title SpiceToken - Fixed Supply ERC20 Token (Baby Bitcoin)
contract SpiceToken is ERC20 {
    // 21,000,000 * 10^18 (Baby Bitcoin 21 million supply, with 18 decimals)
    uint256 public constant MAX_SUPPLY = 21_000_000 * 10 ** 18;

    constructor() ERC20("SpiceToken", "SPICE") {
        _mint(msg.sender, MAX_SUPPLY);
    }
}
