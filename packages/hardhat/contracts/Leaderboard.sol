// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IERC6551Account {
    function owner() external view returns (address);
}

/**
 * Leaderboard Contract
 * - Menerima points dari StakeSpecialBox.sol dan SpecialBox.sol
 * - Mengelola ranking berdasarkan total points
 * - Supports EOA dan TBA address mapping
 * - Gas-efficient dengan pagination untuk frontend
 */

contract Leaderboard is Ownable, ReentrancyGuard, Pausable {
    // ===== Storage =====
    struct UserStats {
        uint256 totalPoints; // Total points (18 decimals)
        uint256 lastUpdate; // Last update timestamp
        address eoa; // EOA address (resolved from TBA)
        address tba; // TBA address
        bool isActive; // Whether user is active
    }

    // Points mapping: address -> points (supports both EOA and TBA)
    mapping(address => UserStats) public userStats;

    // Authorized contracts that can add points
    mapping(address => bool) public authorizedContracts;

    // Leaderboard data for efficient querying
    address[] public leaderboardUsers; // All users with points > 0
    mapping(address => uint256) public userIndexInLeaderboard; // address -> index in leaderboardUsers (1-based, 0 = not in list)

    // ===== Events =====
    event PointsAdded(address indexed tba, uint256 amount, uint256 newTotal, address indexed source);
    event ContractAuthorized(address indexed contractAddr, bool authorized);
    event UserStatsUpdated(address indexed user, address indexed eoa, address indexed tba);
    event LeaderboardUpdated(address indexed tba, uint256 oldRank, uint256 newRank);

    constructor() Ownable(msg.sender) {}

    // ===== Modifiers =====
    modifier onlyAuthorized() {
        require(authorizedContracts[msg.sender], "not authorized");
        _;
    }

    // ===== Core Functions =====

    /// @notice Add points to user (called by authorized contracts)
    /// @param user The user address (can be EOA or TBA)
    /// @param amount Points to add (18 decimals)
    function addXP(address user, uint256 amount) external onlyAuthorized whenNotPaused {
        require(user != address(0), "user=0");
        require(amount > 0, "amount=0");

        UserStats storage stats = userStats[user];

        // Resolve EOA and TBA addresses
        (address eoa, address tba) = _resolveAddresses(user);

        // Update user stats
        stats.totalPoints += amount;
        stats.lastUpdate = block.timestamp;
        stats.eoa = eoa;
        stats.tba = tba;
        stats.isActive = true;

        // Update leaderboard position
        _updateLeaderboardPosition(user);

        emit PointsAdded(user, amount, stats.totalPoints, msg.sender);
        emit UserStatsUpdated(user, eoa, tba);
    }

    /// @notice Batch add points to multiple users
    function batchAddXP(address[] calldata users, uint256[] calldata amounts) external onlyAuthorized whenNotPaused {
        require(users.length == amounts.length, "length mismatch");
        require(users.length > 0, "empty arrays");

        for (uint256 i = 0; i < users.length; i++) {
            if (users[i] != address(0) && amounts[i] > 0) {
                UserStats storage stats = userStats[users[i]];

                (address eoa, address tba) = _resolveAddresses(users[i]);

                stats.totalPoints += amounts[i];
                stats.lastUpdate = block.timestamp;
                stats.eoa = eoa;
                stats.tba = tba;
                stats.isActive = true;

                _updateLeaderboardPosition(users[i]);

                emit PointsAdded(users[i], amounts[i], stats.totalPoints, msg.sender);
                emit UserStatsUpdated(users[i], eoa, tba);
            }
        }
    }

    /// @dev Update user position in leaderboard array
    function _updateLeaderboardPosition(address user) internal {
        uint256 currentIndex = userIndexInLeaderboard[user];

        if (currentIndex == 0) {
            // New user, add to leaderboard
            leaderboardUsers.push(user);
            userIndexInLeaderboard[user] = leaderboardUsers.length;
        }

        // Note: We don't maintain sorted order in storage for gas efficiency
        // Sorting will be done in view functions or frontend
    }

    // ===== View Functions =====

    /// @notice Get user rank (1-based). Returns 0 if user not found.
    function getUserRank(address user) external view returns (uint256 rank) {
        if (userStats[user].totalPoints == 0) return 0;

        uint256 userPoints = userStats[user].totalPoints;
        uint256 higherCount = 0;

        for (uint256 i = 0; i < leaderboardUsers.length; i++) {
            address otherUser = leaderboardUsers[i];
            if (userStats[otherUser].totalPoints > userPoints) {
                higherCount++;
            }
        }

        return higherCount + 1;
    }

    /// @notice Get top N users (sorted by points descending)
    function getTopUsers(
        uint256 limit
    )
        external
        view
        returns (address[] memory users, uint256[] memory points, address[] memory eoas, address[] memory tbas)
    {
        uint256 totalUsers = leaderboardUsers.length;
        uint256 returnCount = limit > totalUsers ? totalUsers : limit;

        // Create arrays for sorting
        address[] memory tempUsers = new address[](totalUsers);
        uint256[] memory tempPoints = new uint256[](totalUsers);

        // Copy data
        for (uint256 i = 0; i < totalUsers; i++) {
            tempUsers[i] = leaderboardUsers[i];
            tempPoints[i] = userStats[leaderboardUsers[i]].totalPoints;
        }

        // Sort by points (bubble sort for simplicity, consider more efficient sorting for large datasets)
        for (uint256 i = 0; i < totalUsers; i++) {
            for (uint256 j = i + 1; j < totalUsers; j++) {
                if (tempPoints[i] < tempPoints[j]) {
                    // Swap
                    (tempPoints[i], tempPoints[j]) = (tempPoints[j], tempPoints[i]);
                    (tempUsers[i], tempUsers[j]) = (tempUsers[j], tempUsers[i]);
                }
            }
        }

        // Return top N
        users = new address[](returnCount);
        points = new uint256[](returnCount);
        eoas = new address[](returnCount);
        tbas = new address[](returnCount);

        for (uint256 i = 0; i < returnCount; i++) {
            users[i] = tempUsers[i];
            points[i] = tempPoints[i];
            eoas[i] = userStats[tempUsers[i]].eoa;
            tbas[i] = userStats[tempUsers[i]].tba;
        }
    }

    /// @notice Get leaderboard with pagination
    function getLeaderboardPage(
        uint256 offset,
        uint256 limit
    )
        external
        view
        returns (
            address[] memory users,
            uint256[] memory points,
            address[] memory eoas,
            address[] memory tbas,
            uint256[] memory ranks,
            uint256 totalUsers
        )
    {
        totalUsers = leaderboardUsers.length;

        if (offset >= totalUsers) {
            // Return empty arrays
            return (
                new address[](0),
                new uint256[](0),
                new address[](0),
                new address[](0),
                new uint256[](0),
                totalUsers
            );
        }

        uint256 returnCount = limit;
        if (offset + limit > totalUsers) {
            returnCount = totalUsers - offset;
        }

        // Get sorted data (reuse logic from getTopUsers)
        address[] memory tempUsers = new address[](totalUsers);
        uint256[] memory tempPoints = new uint256[](totalUsers);

        for (uint256 i = 0; i < totalUsers; i++) {
            tempUsers[i] = leaderboardUsers[i];
            tempPoints[i] = userStats[leaderboardUsers[i]].totalPoints;
        }

        // Sort
        for (uint256 i = 0; i < totalUsers; i++) {
            for (uint256 j = i + 1; j < totalUsers; j++) {
                if (tempPoints[i] < tempPoints[j]) {
                    (tempPoints[i], tempPoints[j]) = (tempPoints[j], tempPoints[i]);
                    (tempUsers[i], tempUsers[j]) = (tempUsers[j], tempUsers[i]);
                }
            }
        }

        // Return page
        users = new address[](returnCount);
        points = new uint256[](returnCount);
        eoas = new address[](returnCount);
        tbas = new address[](returnCount);
        ranks = new uint256[](returnCount);

        for (uint256 i = 0; i < returnCount; i++) {
            uint256 index = offset + i;
            users[i] = tempUsers[index];
            points[i] = tempPoints[index];
            eoas[i] = userStats[tempUsers[index]].eoa;
            tbas[i] = userStats[tempUsers[index]].tba;
            ranks[i] = index + 1; // 1-based ranking
        }
    }

    /// @notice Get specific user's complete stats
    function getUserStats(
        address user
    )
        external
        view
        returns (uint256 totalPoints, uint256 rank, address eoa, address tba, uint256 lastUpdate, bool isActive)
    {
        UserStats memory stats = userStats[user];
        return (stats.totalPoints, this.getUserRank(user), stats.eoa, stats.tba, stats.lastUpdate, stats.isActive);
    }

    /// @notice Get total number of active users
    function getTotalUsers() external view returns (uint256) {
        return leaderboardUsers.length;
    }

    // ===== Admin Functions =====

    /// @notice Authorize/deauthorize contract to add points
    function setContractAuthorization(address contractAddr, bool authorized) external onlyOwner {
        require(contractAddr != address(0), "contract=0");
        authorizedContracts[contractAddr] = authorized;
        emit ContractAuthorized(contractAddr, authorized);
    }

    /// @notice Batch authorize multiple contracts
    function batchSetContractAuthorization(
        address[] calldata contracts,
        bool[] calldata authorizations
    ) external onlyOwner {
        require(contracts.length == authorizations.length, "length mismatch");

        for (uint256 i = 0; i < contracts.length; i++) {
            if (contracts[i] != address(0)) {
                authorizedContracts[contracts[i]] = authorizations[i];
                emit ContractAuthorized(contracts[i], authorizations[i]);
            }
        }
    }

    /// @notice Emergency function to manually update user stats (admin only)
    function adminUpdateUserStats(address user, uint256 points, address eoa, address tba) external onlyOwner {
        require(user != address(0), "user=0");

        UserStats storage stats = userStats[user];
        uint256 oldPoints = stats.totalPoints;

        stats.totalPoints = points;
        stats.lastUpdate = block.timestamp;
        stats.eoa = eoa;
        stats.tba = tba;
        stats.isActive = points > 0;

        if (oldPoints == 0 && points > 0) {
            // New user
            _updateLeaderboardPosition(user);
        } else if (oldPoints > 0 && points == 0) {
            // Remove user
            _removeFromLeaderboard(user);
        }

        emit PointsAdded(user, points, points, address(this));
        emit UserStatsUpdated(user, eoa, tba);
    }

    /// @dev Remove user from leaderboard array
    function _removeFromLeaderboard(address user) internal {
        uint256 index = userIndexInLeaderboard[user];
        if (index == 0) return; // Not in leaderboard

        uint256 arrayIndex = index - 1; // Convert to 0-based
        uint256 lastIndex = leaderboardUsers.length - 1;

        if (arrayIndex != lastIndex) {
            // Move last element to deleted spot
            leaderboardUsers[arrayIndex] = leaderboardUsers[lastIndex];
            userIndexInLeaderboard[leaderboardUsers[arrayIndex]] = index;
        }

        // Remove last element
        leaderboardUsers.pop();
        delete userIndexInLeaderboard[user];
    }

    /// @notice Reset all leaderboard data (emergency function)
    function resetLeaderboard() external onlyOwner {
        for (uint256 i = 0; i < leaderboardUsers.length; i++) {
            delete userStats[leaderboardUsers[i]];
            delete userIndexInLeaderboard[leaderboardUsers[i]];
        }
        delete leaderboardUsers;
    }

    function pause() external onlyOwner {
        _pause();
    }
    function unpause() external onlyOwner {
        _unpause();
    }

    // ===== Utility Functions =====

    /// @notice Check if address is authorized to add points
    function isAuthorized(address contractAddr) external view returns (bool) {
        return authorizedContracts[contractAddr];
    }

    /// @notice Get leaderboard length
    /// @notice Resolve EOA from potential TBA address
    function resolveEOA(address addr) external view returns (address eoa, address tba) {
        try IERC6551Account(addr).owner() returns (address owner) {
            if (owner != address(0)) {
                return (owner, addr); // addr is TBA
            } else {
                return (addr, addr); // addr is EOA or misconfigured TBA
            }
        } catch {
            return (addr, addr); // addr is EOA
        }
    }

    /// @dev Internal resolve function to get EOA and TBA addresses
    function _resolveAddresses(address addr) internal view returns (address eoa, address tba) {
        try IERC6551Account(addr).owner() returns (address owner) {
            if (owner != address(0)) {
                return (owner, addr);
            }
        } catch {}
        return (addr, addr);
    }
}
