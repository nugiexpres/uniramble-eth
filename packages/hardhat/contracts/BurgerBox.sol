// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { ERC1155 } from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import { ERC1155Supply } from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title BurgerBox (ERC1155)
/// @notice Game ticket system untuk berbagai mini-games dan rewards
contract BurgerBox is ERC1155, ERC1155Supply, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");

    // Predefined Token IDs dengan constants untuk clarity
    uint256 public constant BURGER_GAME_1 = 1;
    uint256 public constant BURGER_GAME_2 = 2;
    uint256 public constant PIZZA_GAME = 3;
    uint256 public constant SPECIAL_REWARD = 10;
    uint256 public constant RARE_TICKET = 20;

    // Whitelist ID yang aktif untuk dipakai sebagai tiket
    mapping(uint256 => bool) public activeTicketId;

    // Optional: Track ticket names untuk UI
    mapping(uint256 => string) public ticketNames;

    // Events
    event TicketIdActivated(uint256 indexed id, bool active);
    event TicketNameSet(uint256 indexed id, string name);
    event BatchMinted(address indexed to, uint256[] ids, uint256[] amounts);

    constructor(string memory baseURI, address admin) ERC1155(baseURI) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
        _grantRole(URI_SETTER_ROLE, admin);

        // Auto-activate common ticket IDs
        _activateDefaultTickets();
        _setDefaultTicketNames();
    }

    // === ADMIN FUNCTIONS ===

    /**
     * @notice Update base URI (dengan {id} placeholder support)
     * @param newuri Base URI seperti "http://localhost:3000/metadata/{id}.json"
     */
    function setURI(string calldata newuri) external onlyRole(URI_SETTER_ROLE) {
        _setURI(newuri);
    }

    /**
     * @notice Activate/deactivate ticket ID untuk minting
     */
    function setActiveTicketId(uint256 id, bool active) external onlyRole(DEFAULT_ADMIN_ROLE) {
        activeTicketId[id] = active;
        emit TicketIdActivated(id, active);
    }

    /**
     * @notice Batch activate multiple ticket IDs
     */
    function batchSetActiveTicketIds(uint256[] calldata ids, bool active) external onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint256 i = 0; i < ids.length; i++) {
            activeTicketId[ids[i]] = active;
            emit TicketIdActivated(ids[i], active);
        }
    }

    /**
     * @notice Set ticket name untuk UI display
     */
    function setTicketName(uint256 id, string calldata name) external onlyRole(DEFAULT_ADMIN_ROLE) {
        ticketNames[id] = name;
        emit TicketNameSet(id, name);
    }

    /**
     * @notice Batch set ticket names
     */
    function batchSetTicketNames(
        uint256[] calldata ids,
        string[] calldata names
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(ids.length == names.length, "Arrays length mismatch");

        for (uint256 i = 0; i < ids.length; i++) {
            ticketNames[ids[i]] = names[i];
            emit TicketNameSet(ids[i], names[i]);
        }
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // === MINTING FUNCTIONS ===

    /**
     * @notice Mint single ticket type
     */
    function mint(address to, uint256 id, uint256 amount, bytes memory data) external onlyRole(MINTER_ROLE) {
        require(activeTicketId[id], "Ticket ID not active");
        _mint(to, id, amount, data);
    }

    /**
     * @notice Mint multiple ticket types at once
     */
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyRole(MINTER_ROLE) {
        // Validate all IDs are active
        for (uint256 i = 0; i < ids.length; i++) {
            require(activeTicketId[ids[i]], "Ticket ID not active");
        }

        _mintBatch(to, ids, amounts, data);
        emit BatchMinted(to, ids, amounts);
    }

    /**
     * @notice Convenient function untuk mint reward tickets
     */
    function mintReward(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(activeTicketId[SPECIAL_REWARD], "Special reward not active");
        _mint(to, SPECIAL_REWARD, amount, "");
    }

    // === BURNING FUNCTIONS ===

    /**
     * @notice Burn single ticket (game consumption)
     */
    function burn(address from, uint256 id, uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(from, id, amount);
    }

    /**
     * @notice Burn multiple tickets at once
     */
    function burnBatch(address from, uint256[] memory ids, uint256[] memory amounts) external onlyRole(BURNER_ROLE) {
        _burnBatch(from, ids, amounts);
    }

    /**
     * @notice Convenient burn untuk game entry
     */
    function burnForGameEntry(address from, uint256 gameId, uint256 amount) external onlyRole(BURNER_ROLE) {
        require(totalSupply(gameId) >= amount, "Insufficient supply");
        _burn(from, gameId, amount);
    }

    // === VIEW FUNCTIONS ===

    /**
     * @notice Check if ticket ID is active
     */
    function isActiveTicket(uint256 id) external view returns (bool) {
        return activeTicketId[id];
    }

    /**
     * @notice Get ticket name
     */
    function getTicketName(uint256 id) external view returns (string memory) {
        return ticketNames[id];
    }

    /**
     * @notice Get user's balance untuk specific ticket
     */
    function getTicketBalance(address account, uint256 id) external view returns (uint256) {
        return balanceOf(account, id);
    }

    /**
     * @notice Get user's balances untuk multiple tickets
     */
    function getTicketBalances(address account, uint256[] calldata ids) external view returns (uint256[] memory) {
        return balanceOfBatch(_asSingletonArray(account, ids.length), ids);
    }

    /**
     * @notice Get all active ticket IDs (untuk UI)
     */
    function getActiveTicketIds() external view returns (uint256[] memory) {
        uint256[] memory tempIds = new uint256[](100); // Temporary array
        uint256 count = 0;

        // Check common IDs
        uint256[] memory commonIds = new uint256[](5);
        commonIds[0] = BURGER_GAME_1;
        commonIds[1] = BURGER_GAME_2;
        commonIds[2] = PIZZA_GAME;
        commonIds[3] = SPECIAL_REWARD;
        commonIds[4] = RARE_TICKET;

        for (uint256 i = 0; i < commonIds.length; i++) {
            if (activeTicketId[commonIds[i]]) {
                tempIds[count] = commonIds[i];
                count++;
            }
        }

        // Create exact size array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = tempIds[i];
        }

        return result;
    }

    /**
     * @notice Check total supply untuk ticket ID
     */
    function getTicketSupply(uint256 id) external view returns (uint256) {
        return totalSupply(id);
    }

    // === INTERNAL FUNCTIONS ===

    /**
     * @notice Auto-activate default tickets saat deploy
     */
    function _activateDefaultTickets() private {
        activeTicketId[BURGER_GAME_1] = true;
        activeTicketId[BURGER_GAME_2] = true;
        activeTicketId[PIZZA_GAME] = true;
        activeTicketId[SPECIAL_REWARD] = true;
    }

    /**
     * @notice Set default ticket names
     */
    function _setDefaultTicketNames() private {
        ticketNames[BURGER_GAME_1] = "Burger Cooking Ticket";
        ticketNames[BURGER_GAME_2] = "Advanced Burger Ticket";
        ticketNames[PIZZA_GAME] = "Pizza Making Ticket";
        ticketNames[SPECIAL_REWARD] = "Special Reward Ticket";
        ticketNames[RARE_TICKET] = "Rare Game Access";
    }

    /**
     * @notice Helper untuk batch operations
     */
    function _asSingletonArray(address account, uint256 length) private pure returns (address[] memory) {
        address[] memory array = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            array[i] = account;
        }
        return array;
    }

    // === HOOKS & OVERRIDES ===

    /**
     * @notice Update hook dengan pause protection
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) whenNotPaused {
        super._update(from, to, ids, values);
    }

    /**
     * @notice Support interface untuk AccessControl + ERC1155
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // === EMERGENCY & UTILITY ===

    /**
     * @notice Emergency mint untuk testing/recovery
     */
    function emergencyMint(address to, uint256 id, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _mint(to, id, amount, "");
    }
}
