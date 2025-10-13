// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IFoodScramble Interface
 * @notice Interface untuk FoodScramble contract yang digunakan oleh FasterTx
 * @dev Main game contract yang mengelola TBA (Token Bound Account) dan player data
 */
interface IFoodScramble {
	/**
	 * @notice Struct untuk menyimpan statistik player
	 */
	struct PlayerStats {
		uint256 totalRolls;
		uint256 ingredientsCollected;
		uint256 foodsMinted;
		uint256 lastActive;
		bool hasSpecialAccess;
	}

	/**
	 * @notice Struct untuk menyimpan informasi box/grid
	 */
	struct Box {
		uint256 id;
		string typeGrid;
		uint256 ingredientType;
		uint256 numberOfPlayers;
	}

	/**
	 * @notice Get Token Bound Account (TBA) address untuk specific EOA
	 * @param user Externally Owned Account address
	 * @return TBA address associated with the EOA
	 */
	function tbaList(address user) external view returns (address);

	/**
	 * @notice Get current player position in grid
	 * @param tba Token Bound Account address
	 * @return Current position of player in the grid
	 */
	function player(address tba) external view returns (uint256);

	/**
	 * @notice Check if player can buy ingredient at current position
	 * @param tba Token Bound Account address
	 * @return True if player can buy ingredient, false otherwise
	 */
	function canBuy(address tba) external view returns (bool);

	/**
	 * @notice Get player roll count
	 * @param tba Token Bound Account address
	 * @return Number of rolls made by player
	 */
	function rollCount(address tba) external view returns (uint256);

	/**
	 * @notice Get player statistics
	 * @param tba Token Bound Account address
	 * @return PlayerStats struct containing player statistics
	 */
	function stats(address tba) external view returns (PlayerStats memory);

	/**
	 * @notice Get username for a player
	 * @param eoa Player EOA address
	 * @return Username string
	 */
	function usernames(address eoa) external view returns (string memory);

	/**
	 * @notice Get EOA address from username
	 * @param username Username string
	 * @return EOA address associated with the username
	 */
	function nameToAddress(
		string memory username
	) external view returns (address);

	/**
	 * @notice Set TBA address for user (manual mapping)
	 * @param user EOA address
	 * @param tba TBA address to associate with the user
	 */
	function setTBA(address user, address tba) external;

	/**
	 * @notice Check if player account is ready (TBA initialized)
	 * @param user EOA address to check
	 * @return True if account is ready, false otherwise
	 */
	function accountReady(address user) external view returns (bool);

	/**
	 * @notice Check if player has been created
	 * @param tba Token Bound Account address
	 * @return True if player is created, false otherwise
	 */
	function isPlayerCreated(address tba) external view returns (bool);

	/**
	 * @notice Get complete grid information
	 * @return Array of Box structs representing the game grid
	 */
	function getGrid() external view returns (Box[] memory);

	/**
	 * @notice Get food NFTs owned by a player
	 * @param owner EOA address of the owner
	 * @return Array of token IDs owned by the player
	 */
	function getMyFoods(address owner) external view returns (uint256[] memory);

	/**
	 * @notice Check if position allows buying ingredient
	 * @param position Grid position to check
	 * @return True if position allows buying, false otherwise
	 */
	function canBuyAtPosition(uint256 position) external view returns (bool);

	/**
	 * @notice Get ingredient type at specific position
	 * @param position Grid position
	 * @return Ingredient type at the position
	 */
	function getIngredientTypeAtPosition(
		uint256 position
	) external view returns (uint256);

	/**
	 * @notice Get current ingredient fee
	 * @return Current fee for buying ingredients
	 */
	function getIngredientFee() external view returns (uint256);

	/**
	 * @notice Get faucet amount
	 * @return Amount distributed by faucet
	 */
	function getFaucetAmount() external view returns (uint256);

	/**
	 * @notice Get faucet cooldown period
	 * @return Cooldown period in seconds
	 */
	function getFaucetCooldown() external view returns (uint256);

	/**
	 * @notice Get faucet usage count for player
	 * @param eoa Player EOA address
	 * @return Number of times player has used faucet
	 */
	function faucetUsageCount(address eoa) external view returns (uint256);

	/**
	 * @notice Get last faucet usage timestamp for player
	 * @param eoa Player EOA address
	 * @return Timestamp of last faucet usage
	 */
	function lastFaucetUsage(address eoa) external view returns (uint256);

	/**
	 * @notice Get last minted special box timestamp for player
	 * @param eoa Player EOA address
	 * @return Timestamp of last special box mint
	 */
	function lastMintedSpecialBox(address eoa) external view returns (uint256);

	/**
	 * @notice Get travel history for player
	 * @param eoa Player EOA address
	 * @return Array of positions visited by player
	 */
	function travelHistory(
		address eoa
	) external view returns (uint256[] memory);

	/**
	 * @notice Move player on the grid
	 */
	function movePlayer() external;

	/**
	 * @notice Buy ingredient at current position
	 */
	function buyIngredient() external payable;

	/**
	 * @notice Travel using rail system
	 */
	function travelRail() external;

	/**
	 * @notice Mint food NFT using collected ingredients
	 */
	function mintFoodNFT() external;

	/**
	 * @notice Use faucet to get ETH
	 */
	function useFaucetMon() external;

	/**
	 * @notice Set username for player
	 * @param name Username to set
	 */
	function setUsername(string calldata name) external;

	/**
	 * @notice Create Token Bound Account
	 * @param implementation Implementation address
	 * @param chainId Chain ID
	 * @param tokenContract Token contract address
	 * @param tokenId Token ID
	 * @param salt Salt for account creation
	 * @param initData Initialization data
	 */
	function createTokenBoundAccount(
		address implementation,
		uint256 chainId,
		address tokenContract,
		uint256 tokenId,
		uint256 salt,
		bytes calldata initData
	) external;

	/**
	 * @notice Events
	 */
	event PlayerMoved(address indexed player, uint256 newPosition);
	event SpecialBoxMinted(address indexed user, uint256 hamburgerCount);
	event PlayerCreated(address indexed tba, uint256 gridIndex);
	event TokenBoundAccountCreated(
		address indexed eoa,
		address indexed tba,
		uint256 startPosition
	);
	event IngredientPurchased(
		address indexed player,
		uint256 ingredientType,
		uint256 fee
	);
	event IngredientFeeUpdated(uint256 oldFee, uint256 newFee);
	event FaucetAmountUpdated(uint256 oldAmount, uint256 newAmount);
	event FaucetCooldownUpdated(uint256 oldCooldown, uint256 newCooldown);
}
