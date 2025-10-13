// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title Interface for Leaderboard
/// @notice Used by other contracts (e.g., SpecialBoxManager) to add XP or read leaderboard
interface ILeaderboard {
    /// @notice Add XP/points to a user
    /// @param user The user address (EOA or TBA)
    /// @param xp Points to add
    /// @param source Source of XP/points
function addXP(address user, uint256 xp, string calldata source) external;

/// @notice Add batch XP/points to all user
/// @param users The user address (EOA or TBA)
/// @param amounts Points to add
function batchAddXP(address[] calldata users, uint256[] calldata amounts) external;

    /// @notice Get total points of a user
    /// @param tba The user address (EOA or TBA)
    /// @return totalPoints Total accumulated points
    /// function getPoints(address tba) external view returns (uint256 totalPoints);

    /// @notice Get leaderboard rank of a user
    /// @param user The user address (EOA or TBA)
    /// @return rank Rank of the user (1 = top)
    function getUserRank(address user) external view returns (uint256 rank);

    /// @notice Get top N users in leaderboard
    /// @param topN Number of top users to return
    /// @return users Array of user addresses
    /// @return points Array of corresponding points
    function getTopUsers(uint256 topN) external view returns (address[] memory users, uint256[] memory points);

    /// @notice Event emitted when points are added
    event PointsAdded(address indexed tba, uint256 amount, uint256 newTotal, address indexed source);

    /// @notice Event emitted when a user's stats are updated
    event UserStatsUpdated(address indexed user, address indexed eoa, address indexed tba);
}
