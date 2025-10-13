// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IFasterRegister
 * @dev Interface for FasterRegister contract
 */
interface IFasterRegister {
    // Player management functions
    function isPlayerFullyRegistered(address tba) external view returns (bool);
    function getTBAFromEOA(address eoa) external view returns (address);
    function getEOAFromTBA(address tba) external view returns (address);
    function getMyTBA() external view returns (address);
    
    // Player stats management
    function updatePlayerStats(
        address tba,
        uint256 newBestTime,
        uint256 totalTx,
        uint256 weeklyRank,
        uint256 lastWeek
    ) external;
    
    function incrementTransactionCount(address tba) external;
    function updateBestTime(address tba, uint256 newTime) external;
    function updateWeeklyRank(address tba, uint256 rank) external;
    function setLastPlayedWeek(address tba, uint256 week) external;
    
    // View functions
    function getPlayerInfo(address tba) external view returns (
        address eoaAddress,
        address tbaAddress,
        uint256 bestTime,
        uint256 totalTransactions,
        uint256 weeklyRank,
        bool isActive,
        bool hasPaidRegistration
    );
    
    function getRegistrationStatus(address tba) external view returns (
        bool isRegistered,
        bool paymentDone,
        bool playerActive,
        bool feePaid,
        uint256 paymentAmount,
        uint256 registrationTime
    );
    
    // Utility functions
    function getRegistrationFee() external view returns (uint256);
    function isAccountReady(address eoa) external view returns (bool);
    function getTBABalance(address tba) external view returns (uint256);
}

/**
 * @title IFasterReward
 * @dev Interface for FasterReward contract
 */
interface IFasterReward {
    // Daily reward functions
    function processDailyReward(address tba) external returns (string memory);
    function claimDailyReward() external;
    
    // Weekly reward functions
    function processWeeklyReward(address tba, uint256 week, uint256 playerRank) external;
    function claimWeeklyReward(uint256 week, uint256 playerRank) external;
    
    // View functions
    function canBurnToday(address tba) external view returns (bool);
    function getBurnCooldownRemaining(address tba) external view returns (uint256);
    function getMyBurnCooldownRemaining() external view returns (uint256);
    function canIBurnToday() external view returns (bool);
    
    function getRewardProbabilities() external view returns (uint256 bomb, uint256 burger, uint256 mon);
    function getRewardConfig() external view returns (
        uint256 burgerBoxId,
        uint256 burgerBoxAmount,
        uint256 monTokenAmount,
        uint256 bombChance,
        uint256 burgerChance,
        uint256 monChance
    );
    
    function isWeeklyRewardClaimed(address tba, uint256 week) external view returns (bool);
    function getWeeklyRewardConfig(uint256 week) external view returns (
        uint256 amount,
        uint256 maxRank,
        bool active
    );
    
    function getContractBalance() external view returns (uint256);
}

/**
 * @title IFasterTx
 * @dev Interface for FasterTx contract
 */
interface IFasterTx {
    // Game functions
    function startSpeedTest() external returns (uint256 gameId, uint256 transactionTime, string memory rewardType);
    function claimWeeklyReward(uint256 week) external;
    
    // View functions
    function canPlay() external view returns (bool canPlayGame, string memory reason);
    function canTBAPlay(address tba) external view returns (bool canPlayGame, string memory reason);
    
    function getCurrentWeek() external view returns (uint256);
    function getTBAWeeklyBestTime(address tba, uint256 week) external view returns (uint256);
    function getMyWeeklyBestTime(uint256 week) external view returns (uint256);
    function hasTBAPlayedThisWeek(address tba, uint256 week) external view returns (bool);
    function haveIPlayedThisWeek(uint256 week) external view returns (bool);
    
    // Leaderboard functions
    function getWeeklyLeaderboard(uint256 week) external view returns (
        address[] memory eoaAddresses,
        address[] memory tbaAddresses,
        uint256[] memory times,
        uint256[] memory ranks
    );
    
    function getMonthlyLeaderboard(uint256 month) external view returns (
        address[] memory eoaAddresses,
        address[] memory tbaAddresses,
        uint256[] memory times,
        uint256[] memory ranks
    );
    
    function getPlayerWeeklyRank(address tba, uint256 week) external view returns (uint256);
    function getMyWeeklyRank(uint256 week) external view returns (uint256);
    
    // Game session functions
    function getGameSession(uint256 gameId) external view returns (
        uint256 id,
        address signerEoa,
        address playerTba,
        uint256 startTime,
        uint256 endTime,
        bool isCompleted,
        uint256 transactionTime,
        string memory rewardReceived
    );
    
    function getTotalGamesPlayed() external view returns (uint256);
}