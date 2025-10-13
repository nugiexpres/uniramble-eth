// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ISpecialBox {
    // === EVENTS ===
    event MintBox(address indexed user, address indexed tba, uint256 tokenId);
    event Burn(address indexed user, address indexed tba, uint256 tokenId);
    event BoxPriceUpdated(uint256 newPrice);
    event PaymentGatewayUpdated(address newGateway);

    // === MINT FUNCTIONS ===

    /**
     * @notice Mint satu box dengan memburn 10 hamburger
     * @dev Cek 10 hamburger di TBA, burn, lalu mint box
     * @return tokenId yang di-mint
     */
    function mintBox() external payable returns (uint256);

    // === BURN FUNCTIONS ===

    /**
     * @notice Burn single box by token ID (only authorized burners)
     * @param tokenId ID of box to burn
     */
    function burnBox(uint256 tokenId) external;

    // === VIEW FUNCTIONS - TBA BALANCE ===

    /**
     * @notice Get TBA's box balance
     * @param tba TBA address
     * @return Array of box token IDs owned by TBA
     */
    function boxBalance(address tba) external view returns (uint256[] memory);

    // === VIEW FUNCTIONS - GENERAL ===

    /**
     * @notice Get user's TBA address
     * @param user User address
     * @return TBA address for the user
     */
    function getTBA(address user) external view returns (address);

    /**
     * @notice Check berapa box yang bisa di-mint dari TBA
     * @param tba TBA address
     * @return Jumlah box yang bisa di-mint
     */
    function canMint(address tba) external view returns (uint256);

    /**
     * @notice Get total supply of boxes
     * @return Total number of boxes minted
     */
    function total() external view returns (uint256);

    /**
     * @notice Get total cost untuk mint
     * @return ethCost ETH cost per box
     */
    function getMintCost() external view returns (uint256 ethCost);

    /**
     * @notice Get current box price
     */
    function getBoxPrice() external view returns (uint256);

    // === HAMBURGER FUNCTIONS ===

    /**
     * @notice Cek apakah TBA punya minimal 10 hamburger
     * @param tba Address TBA yang dicek
     * @return true jika punya >= 10 hamburger
     */
    function hasEnoughHamburgers(address tba) external view returns (bool);

    // === ADMIN VIEW FUNCTIONS ===

    /**
     * @notice Check if address is authorized burner
     * @param burner Address to check
     * @return True if authorized, false otherwise
     */
    function burners(address burner) external view returns (bool);

    // === ERC721 STANDARD FUNCTIONS ===

    /**
     * @notice Get owner of token
     * @param tokenId Token ID
     * @return Address of token owner
     */
    function ownerOf(uint256 tokenId) external view returns (address);

    /**
     * @notice Get balance of address (ERC721 standard)
     * @param owner Address to check
     * @return Number of tokens owned
     */
    function balanceOf(address owner) external view returns (uint256);

    /**
     * @notice Get approved address for token
     * @param tokenId Token ID
     * @return Approved address
     */
    function getApproved(uint256 tokenId) external view returns (address);

    /**
     * @notice Check if operator is approved for all tokens of owner
     * @param owner Token owner
     * @param operator Operator address
     * @return True if approved for all
     */
    function isApprovedForAll(address owner, address operator) external view returns (bool);

    /**
     * @notice Get token name
     * @return Token name
     */
    function name() external view returns (string memory);

    /**
     * @notice Get token symbol
     * @return Token symbol
     */
    function symbol() external view returns (string memory);

    /**
     * @notice Get token URI
     * @param tokenId Token ID
     * @return Token URI
     */
    function tokenURI(uint256 tokenId) external view returns (string memory);

    // === TRANSFER FUNCTIONS ===

    /**
     * @notice Transfer token from one address to another
     * @param from Source address
     * @param to Destination address
     * @param tokenId Token ID to transfer
     */
    function transferFrom(address from, address to, uint256 tokenId) external;

    /**
     * @notice Safely transfer token from one address to another
     * @param from Source address
     * @param to Destination address
     * @param tokenId Token ID to transfer
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) external;

    /**
     * @notice Safely transfer token from one address to another with data
     * @param from Source address
     * @param to Destination address
     * @param tokenId Token ID to transfer
     * @param data Additional data
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) external;

    // === APPROVAL FUNCTIONS ===

    /**
     * @notice Approve address to transfer specific token
     * @param to Address to approve
     * @param tokenId Token ID to approve
     */
    function approve(address to, uint256 tokenId) external;

    /**
     * @notice Set approval for all tokens
     * @param operator Operator address
     * @param approved Approval status
     */
    function setApprovalForAll(address operator, bool approved) external;

    // === CONSTANTS ===

    /**
     * @notice Cost in hamburgers to mint one box
     * @return Number of hamburgers required
     */
    function HAMBURGER_COST() external view returns (uint256);
}

// === SEPARATE INTERFACE FOR STAKING ===

interface ISpecialBoxStake {
    // === EVENTS ===
    event Stake(address indexed user, address indexed tba, uint256 tokenId);
    event StakeBatch(address indexed user, address indexed tba, uint256[] tokenIds);
    event Unstake(address indexed user, address indexed tba, uint256 tokenId);
    event UnstakeBatch(address indexed user, address indexed tba, uint256[] tokenIds);
    event StakeAll(address indexed user, address indexed tba, uint256[] tokenIds, uint256 totalStaked);

    // === SINGLE STAKE FUNCTIONS ===

    /**
     * @notice Stake satu box
     * @param tokenId ID box yang akan di-stake
     */
    function stake(uint256 tokenId) external;

    /**
     * @notice Unstake satu box
     * @param tokenId ID box yang akan di-unstake
     */
    function unstake(uint256 tokenId) external;

    // === BATCH STAKE FUNCTIONS ===

    /**
     * @notice Stake multiple boxes
     * @param tokenIds Array ID box yang akan di-stake
     */
    function stakeBatch(uint256[] memory tokenIds) external;

    /**
     * @notice Unstake multiple boxes
     * @param tokenIds Array ID box yang akan di-unstake
     */
    function unstakeBatch(uint256[] memory tokenIds) external;

    // === STAKE ALL FUNCTIONS ===

    /**
     * @notice Stake semua box yang dimiliki di TBA
     * @return tokenIds Array ID box yang di-stake
     */
    function stakeAll() external returns (uint256[] memory);

    /**
     * @notice Unstake semua box yang di-stake di TBA
     * @return tokenIds Array ID box yang di-unstake
     */
    function unstakeAll() external returns (uint256[] memory);

    // === VIEW FUNCTIONS - TBA STAKE BALANCE ===

    /**
     * @notice Get TBA's staked boxes
     * @param tba TBA address
     * @return Array of staked token IDs
     */
    function stakedBoxBalance(address tba) external view returns (uint256[] memory);

    /**
     * @notice Get total staked boxes count for TBA
     * @param tba TBA address
     * @return Total staked count
     */
    function totalStakedBoxes(address tba) external view returns (uint256);

    // === VIEW FUNCTIONS - STAKE STATUS ===

    /**
     * @notice Check if box is staked
     * @param tokenId Box token ID
     * @return true if staked
     */
    function checkStaked(uint256 tokenId) external view returns (bool);

    /**
     * @notice Get who staked the box
     * @param tokenId Box token ID
     * @return TBA address that staked the box
     */
    function getStaker(uint256 tokenId) external view returns (address);

    /**
     * @notice Get user's TBA address
     * @param user User address
     * @return TBA address
     */
    function getTBA(address user) external view returns (address);

    /**
     * @notice Get stakeable boxes count (boxes that can be staked)
     * @param tba TBA address
     * @return Number of boxes that can be staked
     */
    function getStakeableCount(address tba) external view returns (uint256);

    // === MAPPINGS ACCESS ===

    /**
     * @notice Check if token is staked
     * @param tokenId Token ID
     * @return Staked status
     */
    function isStaked(uint256 tokenId) external view returns (bool);

    /**
     * @notice Get who staked the token
     * @param tokenId Token ID
     * @return TBA address
     */
    function stakedBy(uint256 tokenId) external view returns (address);
}
