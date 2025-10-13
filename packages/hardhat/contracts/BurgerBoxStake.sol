// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/*
  BurgerBoxStake - ERC1155 staking contract
  - Role-based access (ADMIN / MANAGER / PAUSER)
  - Supports staking & unstaking single/batch
  - Emergency withdraw & recovery
  - Safe ERC1155 receiving with events
*/

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BurgerBoxStake is AccessControl, ERC1155Holder, ReentrancyGuard {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    IERC1155 public immutable burgerBoxContract;

    bool public paused;

    // stake balances: staker => tokenId => amount
    mapping(address => mapping(uint256 => uint256)) private _balances;

    // events
    event Staked(address indexed user, uint256 indexed id, uint256 amount);
    event Unstaked(address indexed user, uint256 indexed id, uint256 amount);
    event StakedBatch(address indexed user, uint256[] ids, uint256[] amounts);
    event UnstakedBatch(address indexed user, uint256[] ids, uint256[] amounts);
    event Paused(address indexed account);
    event Unpaused(address indexed account);
    event EmergencyWithdraw(address indexed operator, address indexed to, uint256 indexed id, uint256 amount);
    event RecoveredERC20(address token, uint256 amount, address to);
    event RecoveredERC1155(address token, uint256 id, uint256 amount, address to);

    // new events for receiving ERC1155 directly
    event ERC1155Received(address operator, address from, uint256 id, uint256 value, bytes data);
    event ERC1155BatchReceived(address operator, address from, uint256[] ids, uint256[] values, bytes data);

    modifier whenNotPaused() {
        require(!paused, "BurgerBoxStake: paused");
        _;
    }

    modifier onlyManager() {
        require(
            hasRole(MANAGER_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "BurgerBoxStake: not manager"
        );
        _;
    }

    constructor(address _burgerBoxContract, address admin) {
        require(_burgerBoxContract != address(0), "BurgerBoxStake: zero address");
        burgerBoxContract = IERC1155(_burgerBoxContract);

        // grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, admin == address(0) ? msg.sender : admin);
        _grantRole(MANAGER_ROLE, admin == address(0) ? msg.sender : admin);
        _grantRole(PAUSER_ROLE, admin == address(0) ? msg.sender : admin);
    }

    // --- Staking functions ---

    function stake(uint256 id, uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "BurgerBoxStake: amount zero");

        burgerBoxContract.safeTransferFrom(msg.sender, address(this), id, amount, "");
        _balances[msg.sender][id] += amount;

        emit Staked(msg.sender, id, amount);
    }

    function stakeBatch(uint256[] calldata ids, uint256[] calldata amounts) external nonReentrant whenNotPaused {
        require(ids.length == amounts.length, "BurgerBoxStake: ids/amounts mismatch");
        require(ids.length > 0, "BurgerBoxStake: empty arrays");

        burgerBoxContract.safeBatchTransferFrom(msg.sender, address(this), ids, amounts, "");

        for (uint256 i = 0; i < ids.length; i++) {
            require(amounts[i] > 0, "BurgerBoxStake: amount zero in batch");
            _balances[msg.sender][ids[i]] += amounts[i];
        }

        emit StakedBatch(msg.sender, ids, amounts);
    }

    function unstake(uint256 id, uint256 amount) external nonReentrant {
        require(amount > 0, "BurgerBoxStake: amount zero");
        uint256 userBal = _balances[msg.sender][id];
        require(userBal >= amount, "BurgerBoxStake: insufficient staked balance");

        _balances[msg.sender][id] = userBal - amount;
        burgerBoxContract.safeTransferFrom(address(this), msg.sender, id, amount, "");

        emit Unstaked(msg.sender, id, amount);
    }

    function unstakeBatch(uint256[] calldata ids, uint256[] calldata amounts) external nonReentrant {
        require(ids.length == amounts.length, "BurgerBoxStake: ids/amounts mismatch");
        require(ids.length > 0, "BurgerBoxStake: empty arrays");

        for (uint256 i = 0; i < ids.length; i++) {
            uint256 userBal = _balances[msg.sender][ids[i]];
            require(userBal >= amounts[i], "BurgerBoxStake: insufficient staked balance in batch");
            _balances[msg.sender][ids[i]] = userBal - amounts[i];
        }

        burgerBoxContract.safeBatchTransferFrom(address(this), msg.sender, ids, amounts, "");

        emit UnstakedBatch(msg.sender, ids, amounts);
    }

    // --- View helpers ---

    function stakedBalanceOf(address account, uint256 id) external view returns (uint256) {
        return _balances[account][id];
    }

    function stakedBalancesOf(address account, uint256[] calldata ids) external view returns (uint256[] memory) {
        uint256[] memory out = new uint256[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            out[i] = _balances[account][ids[i]];
        }
        return out;
    }

    // --- Admin controls ---

    function pause() external {
        require(
            hasRole(PAUSER_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "BurgerBoxStake: not pauser"
        );
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external {
        require(
            hasRole(PAUSER_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "BurgerBoxStake: not pauser"
        );
        paused = false;
        emit Unpaused(msg.sender);
    }

    function emergencyWithdrawERC1155(
        address token,
        address to,
        uint256 id,
        uint256 amount
    ) external onlyManager nonReentrant {
        require(to != address(0), "BurgerBoxStake: zero address");
        IERC1155(token).safeTransferFrom(address(this), to, id, amount, "");
        emit EmergencyWithdraw(msg.sender, to, id, amount);
    }

    function recoverERC20(address token, address to) external onlyManager nonReentrant {
        require(to != address(0), "BurgerBoxStake: zero address");
        uint256 bal = IERC20(token).balanceOf(address(this));
        require(bal > 0, "BurgerBoxStake: no erc20 balance");
        IERC20(token).transfer(to, bal);
        emit RecoveredERC20(token, bal, to);
    }

    function recoverERC1155(address token, uint256 id, address to) external onlyManager nonReentrant {
        require(to != address(0), "BurgerBoxStake: zero address");
        uint256 bal = IERC1155(token).balanceOf(address(this), id);
        require(bal > 0, "BurgerBoxStake: no erc1155 balance");
        IERC1155(token).safeTransferFrom(address(this), to, id, bal, "");
        emit RecoveredERC1155(token, id, bal, to);
    }

    // --- ERC1155Holder overrides with emit event ---
    function supportsInterface(bytes4 interfaceId) public view override(AccessControl, ERC1155Holder) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes memory data
    ) public virtual override(ERC1155Holder) returns (bytes4) {
        emit ERC1155Received(operator, from, id, value, data);
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] memory ids,
        uint256[] memory values,
        bytes memory data
    ) public virtual override(ERC1155Holder) returns (bytes4) {
        emit ERC1155BatchReceived(operator, from, ids, values, data);
        return this.onERC1155BatchReceived.selector;
    }

    // --- Fallbacks ---

    receive() external payable {}
    fallback() external payable {}
}
