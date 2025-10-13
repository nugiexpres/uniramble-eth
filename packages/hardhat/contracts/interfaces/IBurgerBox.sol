// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IBurgerBox Interface
 * @notice Interface untuk BurgerBox contract yang digunakan oleh FasterTx
 * @dev ERC1155-based ticket system untuk mini-games
 */
interface IBurgerBox {
	/**
	 * @notice Mint BurgerBox tokens to specified address
	 * @param to Address to mint tokens to
	 * @param id Token ID to mint
	 * @param amount Amount of tokens to mint
	 * @param data Additional data for minting
	 */
	function mint(
		address to,
		uint256 id,
		uint256 amount,
		bytes memory data
	) external;

	/**
	 * @notice Batch mint BurgerBox tokens to specified address
	 * @param to Address to mint tokens to
	 * @param ids Array of token IDs to mint
	 * @param amounts Array of amounts to mint for each token ID
	 * @param data Additional data for minting
	 */
	function mintBatch(
		address to,
		uint256[] memory ids,
		uint256[] memory amounts,
		bytes memory data
	) external;

	/**
	 * @notice Burn BurgerBox tokens from specified address
	 * @param from Address to burn tokens from
	 * @param id Token ID to burn
	 * @param amount Amount of tokens to burn
	 */
	function burn(address from, uint256 id, uint256 amount) external;

	/**
	 * @notice Batch burn BurgerBox tokens from specified address
	 * @param from Address to burn tokens from
	 * @param ids Array of token IDs to burn
	 * @param amounts Array of amounts to burn for each token ID
	 */
	function burnBatch(
		address from,
		uint256[] memory ids,
		uint256[] memory amounts
	) external;

	/**
	 * @notice Get balance of specific token ID for an address
	 * @param account Address to check balance for
	 * @param id Token ID to check
	 * @return Balance of the token ID for the address
	 */
	function balanceOf(
		address account,
		uint256 id
	) external view returns (uint256);

	/**
	 * @notice Get balances of multiple token IDs for multiple addresses
	 * @param accounts Array of addresses to check
	 * @param ids Array of token IDs to check
	 * @return Array of balances corresponding to each account-id pair
	 */
	function balanceOfBatch(
		address[] calldata accounts,
		uint256[] calldata ids
	) external view returns (uint256[] memory);

	/**
	 * @notice Check if a ticket ID is active
	 * @param id Token ID to check
	 * @return True if ticket ID is active, false otherwise
	 */
	function activeTicketId(uint256 id) external view returns (bool);

	/**
	 * @notice Set approval for all tokens
	 * @param operator Address to set approval for
	 * @param approved True to approve, false to revoke
	 */
	function setApprovalForAll(address operator, bool approved) external;

	/**
	 * @notice Check if operator is approved for all tokens of owner
	 * @param account Owner address
	 * @param operator Operator address
	 * @return True if operator is approved, false otherwise
	 */
	function isApprovedForAll(
		address account,
		address operator
	) external view returns (bool);

	/**
	 * @notice Safe transfer from one address to another
	 * @param from From address
	 * @param to To address
	 * @param id Token ID
	 * @param amount Amount to transfer
	 * @param data Additional data
	 */
	function safeTransferFrom(
		address from,
		address to,
		uint256 id,
		uint256 amount,
		bytes calldata data
	) external;

	/**
	 * @notice Safe batch transfer from one address to another
	 * @param from From address
	 * @param to To address
	 * @param ids Array of token IDs
	 * @param amounts Array of amounts to transfer
	 * @param data Additional data
	 */
	function safeBatchTransferFrom(
		address from,
		address to,
		uint256[] calldata ids,
		uint256[] calldata amounts,
		bytes calldata data
	) external;
}
