// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title BurgerToken - Experience Points Token
/// @notice ERC20 token untuk reward system dalam BurgerBox ecosystem
/// @dev Supports minting/burning dengan role-based access control
contract BurgerToken is ERC20, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice Maximum supply untuk prevent infinite inflation
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18; // 1B XP tokens

    /// @notice Total XP yang sudah di-burn (untuk tracking purposes)
    uint256 public totalBurned;

    /// @notice Mapping untuk track XP earned per address
    mapping(address => uint256) public totalEarned;

    /// @notice Mapping untuk track XP burned per address
    mapping(address => uint256) public totalBurnedByUser;

    event XPMinted(address indexed to, uint256 amount, string reason);
    event XPBurned(address indexed from, uint256 amount, string reason);
    event MaxSupplyUpdated(uint256 oldSupply, uint256 newSupply);

    constructor(string memory name, string memory symbol, address admin) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /// @notice Mint XP tokens to specified address
    /// @param to Address to mint tokens to
    /// @param amount Amount to mint
    /// @param reason Reason for minting (for tracking)
    function mint(address to, uint256 amount, string calldata reason) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");

        totalEarned[to] += amount;
        _mint(to, amount);

        emit XPMinted(to, amount, reason);
    }

    /// @notice Burn XP tokens from specified address
    /// @param from Address to burn tokens from
    /// @param amount Amount to burn
    /// @param reason Reason for burning (for tracking)
    function burn(address from, uint256 amount, string calldata reason) external onlyRole(BURNER_ROLE) whenNotPaused {
        require(from != address(0), "Cannot burn from zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(from) >= amount, "Insufficient balance");

        totalBurned += amount;
        totalBurnedByUser[from] += amount;
        _burn(from, amount);

        emit XPBurned(from, amount, reason);
    }

    /// @notice Burn own tokens (user-initiated)
    /// @param amount Amount to burn
    function burnSelf(uint256 amount) external whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        totalBurned += amount;
        totalBurnedByUser[msg.sender] += amount;
        _burn(msg.sender, amount);

        emit XPBurned(msg.sender, amount, "Self burn");
    }

    /// @notice Get circulating supply (total supply - burned)
    function circulatingSupply() external view returns (uint256) {
        return totalSupply();
    }

    /// @notice Get net XP for an address (earned - burned)
    function getNetXP(address user) external view returns (uint256) {
        uint256 earned = totalEarned[user];
        uint256 burned = totalBurnedByUser[user];
        return earned > burned ? earned - burned : 0;
    }

    /// @notice Get user XP statistics
    function getUserStats(
        address user
    )
        external
        view
        returns (uint256 currentBalance, uint256 totalEarnedAmount, uint256 totalBurnedAmount, uint256 netXP)
    {
        currentBalance = balanceOf(user);
        totalEarnedAmount = totalEarned[user];
        totalBurnedAmount = totalBurnedByUser[user];
        netXP = totalEarnedAmount > totalBurnedAmount ? totalEarnedAmount - totalBurnedAmount : 0;
    }

    // --- Admin Functions ---

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /// @notice Emergency function untuk admin burn (jika diperlukan)
    function emergencyBurn(address from, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) whenPaused {
        require(balanceOf(from) >= amount, "Insufficient balance");

        totalBurned += amount;
        totalBurnedByUser[from] += amount;
        _burn(from, amount);

        emit XPBurned(from, amount, "Emergency burn");
    }

    // --- Overrides ---

    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }

    /// @notice Override transfer untuk add additional validations jika diperlukan
    function transfer(address to, uint256 amount) public override returns (bool) {
        return super.transfer(to, amount);
    }

    /// @notice Override transferFrom untuk add additional validations jika diperlukan
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        return super.transferFrom(from, to, amount);
    }
}
