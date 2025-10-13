// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ISpecialBox {
    function ownerOf(uint256 tokenId) external view returns (address);
    function boxBalance(address tba) external view returns (uint256[] memory);
    function getTBA(address user) external view returns (address);
    function mintBox(address tba) external;
}

interface IFoodScramble {
    function getTBA(address user) external view returns (address);
    function accountReady(address user) external view returns (bool);
}

interface IFoodNFT {
    function getMyFoods(address owner) external view returns (uint256[] memory);
    function burnFood(uint256 tokenId) external;
}

interface IPaymentGateway {
    function processPayment() external payable;
}

contract SpecialBoxStake is Ownable, ReentrancyGuard {
    // Constants
    uint256 public constant HAMBURGERS_PER_SPECIAL_BOX = 10;

    // Interfaces
    ISpecialBox public specialBox;
    IFoodScramble public foodScramble;
    IFoodNFT public hamburger;
    IPaymentGateway public paymentGateway;

    // Storage - using TBA addresses
    mapping(address => address) public tbaList; // user => TBA address
    mapping(address => uint256[]) public staked; // TBA => staked box IDs
    mapping(uint256 => bool) public isStaked; // tokenId => staked status
    mapping(uint256 => address) public stakedBy; // tokenId => TBA address

    // Fees and configuration
    uint256 public specialBoxFee = 0.01 ether;

    // Events
    event Stake(address indexed user, address indexed tba, uint256 tokenId);
    event StakeBatch(address indexed user, address indexed tba, uint256[] tokenIds);
    event Unstake(address indexed user, address indexed tba, uint256 tokenId);
    event UnstakeBatch(address indexed user, address indexed tba, uint256[] tokenIds);
    event StakeAll(address indexed user, address indexed tba, uint256[] tokenIds, uint256 totalStaked);
    event SpecialBoxMinted(address indexed user, address indexed tba, uint256 amount);

    constructor(
        address _specialBox,
        address _foodScramble,
        address _hamburger,
        address _paymentGateway
    ) Ownable(msg.sender) {
        specialBox = ISpecialBox(_specialBox);
        foodScramble = IFoodScramble(_foodScramble);
        hamburger = IFoodNFT(_hamburger);
        paymentGateway = IPaymentGateway(_paymentGateway);
    }

    // === TBA Management Functions === //

    function setTBA(address user, address tba) external onlyOwner {
        tbaList[user] = tba;
    }

    function getTBA(address user) external view returns (address) {
        return tbaList[user];
    }

    // === Mint Special Box Function === //

    function mintSpecialBoxNFT() external payable {
        address tba = tbaList[msg.sender];
        require(tba != address(0), "TBA not found");

        // Get hamburger count dari TBA
        uint256[] memory myHamburgers = hamburger.getMyFoods(tba);
        uint256 hamburgerCount = myHamburgers.length;

        // Cek minimal 10 hamburger
        require(hamburgerCount >= HAMBURGERS_PER_SPECIAL_BOX, "Need 10+ hamburgers");

        // Cek payment jika ada fee
        if (specialBoxFee > 0) {
            require(msg.value >= specialBoxFee, "Insufficient fee");

            try paymentGateway.processPayment{ value: specialBoxFee }() {
                // Payment success
            } catch {
                revert("Payment processing failed");
            }
        }

        // Burn 10 hamburger pertama yang dimiliki
        uint256[] memory hamburgersToBurn = new uint256[](HAMBURGERS_PER_SPECIAL_BOX);
        for (uint256 i = 0; i < HAMBURGERS_PER_SPECIAL_BOX; i++) {
            hamburgersToBurn[i] = myHamburgers[i];
        }

        // Burn hamburgers satu per satu
        for (uint256 i = 0; i < HAMBURGERS_PER_SPECIAL_BOX; i++) {
            hamburger.burnFood(hamburgersToBurn[i]);
        }

        // Mint 1 special box ke TBA
        specialBox.mintBox(tba);

        emit SpecialBoxMinted(msg.sender, tba, 1);
    }

    // === SINGLE STAKE FUNCTIONS === //

    /**
     * @notice Stake satu box
     * @param tokenId ID box yang akan di-stake
     */
    function stake(uint256 tokenId) external nonReentrant {
        address tba = _getTBA(msg.sender);

        require(specialBox.ownerOf(tokenId) == tba, "Not owner");
        require(!isStaked[tokenId], "Already staked");

        isStaked[tokenId] = true;
        stakedBy[tokenId] = tba;
        staked[tba].push(tokenId);

        emit Stake(msg.sender, tba, tokenId);
    }

    /**
     * @notice Unstake satu box
     * @param tokenId ID box yang akan di-unstake
     */
    function unstake(uint256 tokenId) external nonReentrant {
        address tba = _getTBA(msg.sender);

        require(stakedBy[tokenId] == tba, "Not your stake");
        require(isStaked[tokenId], "Not staked");

        isStaked[tokenId] = false;
        stakedBy[tokenId] = address(0);
        _removeFromArray(staked[tba], tokenId);

        emit Unstake(msg.sender, tba, tokenId);
    }

    // === BATCH STAKE FUNCTIONS === //

    /**
     * @notice Stake multiple boxes
     * @param tokenIds Array ID box yang akan di-stake
     */
    function stakeBatch(uint256[] memory tokenIds) external nonReentrant {
        require(tokenIds.length > 0 && tokenIds.length <= 50, "Invalid batch size");

        address tba = _getTBA(msg.sender);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(specialBox.ownerOf(tokenIds[i]) == tba, "Not owner");
            require(!isStaked[tokenIds[i]], "Already staked");

            isStaked[tokenIds[i]] = true;
            stakedBy[tokenIds[i]] = tba;
            staked[tba].push(tokenIds[i]);
        }

        emit StakeBatch(msg.sender, tba, tokenIds);
    }

    /**
     * @notice Unstake multiple boxes
     * @param tokenIds Array ID box yang akan di-unstake
     */
    function unstakeBatch(uint256[] memory tokenIds) external nonReentrant {
        require(tokenIds.length > 0 && tokenIds.length <= 50, "Invalid batch size");

        address tba = _getTBA(msg.sender);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(stakedBy[tokenIds[i]] == tba, "Not your stake");
            require(isStaked[tokenIds[i]], "Not staked");

            isStaked[tokenIds[i]] = false;
            stakedBy[tokenIds[i]] = address(0);
            _removeFromArray(staked[tba], tokenIds[i]);
        }

        emit UnstakeBatch(msg.sender, tba, tokenIds);
    }

    // === STAKE ALL FUNCTION === //

    /**
     * @notice Stake semua box yang dimiliki di TBA
     * @dev Auto-detect semua box dan stake sekaligus
     * @return tokenIds Array ID box yang di-stake
     */
    function stakeAll() external nonReentrant returns (uint256[] memory) {
        address tba = _getTBA(msg.sender);

        // Get semua box yang dimiliki TBA
        uint256[] memory allBoxes = specialBox.boxBalance(tba);
        require(allBoxes.length > 0, "No boxes to stake");

        // Filter hanya yang belum di-stake
        uint256[] memory toStake = new uint256[](allBoxes.length);
        uint256 count = 0;

        for (uint256 i = 0; i < allBoxes.length; i++) {
            if (!isStaked[allBoxes[i]]) {
                toStake[count] = allBoxes[i];
                count++;
            }
        }

        require(count > 0, "All boxes already staked");
        require(count <= 50, "Too many boxes, use batch");

        // Resize array
        uint256[] memory finalTokenIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            finalTokenIds[i] = toStake[i];
        }

        // Stake semua
        for (uint256 i = 0; i < count; i++) {
            isStaked[finalTokenIds[i]] = true;
            stakedBy[finalTokenIds[i]] = tba;
            staked[tba].push(finalTokenIds[i]);
        }

        emit StakeAll(msg.sender, tba, finalTokenIds, count);

        return finalTokenIds;
    }

    /**
     * @notice Unstake semua box yang di-stake di TBA
     * @return tokenIds Array ID box yang di-unstake
     */
    function unstakeAll() external nonReentrant returns (uint256[] memory) {
        address tba = _getTBA(msg.sender);

        uint256[] memory stakedBoxes = staked[tba];
        require(stakedBoxes.length > 0, "No staked boxes");
        require(stakedBoxes.length <= 50, "Too many staked, use batch");

        // Copy array karena kita akan modify staked[tba]
        uint256[] memory toUnstake = new uint256[](stakedBoxes.length);
        for (uint256 i = 0; i < stakedBoxes.length; i++) {
            toUnstake[i] = stakedBoxes[i];
        }

        // Unstake semua
        for (uint256 i = 0; i < toUnstake.length; i++) {
            isStaked[toUnstake[i]] = false;
            stakedBy[toUnstake[i]] = address(0);
        }

        // Clear staked array
        delete staked[tba];

        emit UnstakeBatch(msg.sender, tba, toUnstake);

        return toUnstake;
    }

    // === VIEW FUNCTIONS === //

    /**
     * @notice Get TBA's staked boxes
     * @param tba TBA address
     * @return Array of staked token IDs
     */
    function stakedBoxBalance(address tba) external view returns (uint256[] memory) {
        return staked[tba];
    }

    /**
     * @notice Get total staked boxes count for TBA
     * @param tba TBA address
     * @return Total staked count
     */
    function totalStakedBoxes(address tba) external view returns (uint256) {
        return staked[tba].length;
    }

    /**
     * @notice Check if box is staked
     * @param tokenId Box token ID
     * @return true if staked
     */
    function checkStaked(uint256 tokenId) external view returns (bool) {
        return isStaked[tokenId];
    }

    /**
     * @notice Get who staked the box
     * @param tokenId Box token ID
     * @return TBA address that staked the box
     */
    function getStaker(uint256 tokenId) external view returns (address) {
        return stakedBy[tokenId];
    }


    /**
     * @notice Get stakeable boxes count (boxes that can be staked)
     * @param tba TBA address
     * @return Number of boxes that can be staked
     */
    function getStakeableCount(address tba) external view returns (uint256) {
        uint256[] memory allBoxes = specialBox.boxBalance(tba);

        uint256 count = 0;
        for (uint256 i = 0; i < allBoxes.length; i++) {
            if (!isStaked[allBoxes[i]]) {
                count++;
            }
        }

        return count;
    }

    // === ADMIN FUNCTIONS === //

    /**
     * @notice Set SpecialBox contract address
     * @param _specialBox New SpecialBox contract address
     */
    function setSpecialBox(address _specialBox) external onlyOwner {
        specialBox = ISpecialBox(_specialBox);
    }

    /**
     * @notice Set FoodScramble contract address
     * @param _foodScramble New FoodScramble contract address
     */
    function setFoodScramble(address _foodScramble) external onlyOwner {
        foodScramble = IFoodScramble(_foodScramble);
    }

    // === INTERNAL FUNCTIONS === //

    function _getTBA(address user) internal view returns (address) {
        if (address(foodScramble) != address(0) && foodScramble.accountReady(user)) {
            return foodScramble.getTBA(user);
        }
        return user;
    }

    function _removeFromArray(uint256[] storage array, uint256 value) private {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == value) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
    }
}
