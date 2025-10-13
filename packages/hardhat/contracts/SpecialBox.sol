// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IFoodNFT {
    function getMyFoods(address _owner) external view returns (uint256[] memory);
    function burnFood(uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
}

interface IFoodScramble {
    function getTBA(address user) external view returns (address);
    function accountReady(address user) external view returns (bool);
}

interface IPaymentGateway {
    function processPayment() external payable;
}

contract SpecialBox is ERC721, Ownable, ReentrancyGuard {
    uint256 private _tokenIds;

    // Interface
    IFoodNFT public foodNFT;
    IFoodScramble public foodScramble;
    IPaymentGateway public paymentGateway;

    // Constants
    uint256 public constant HAMBURGER_COST = 10;
    uint256 public boxPrice = 0 ether;

    // Authorized burners
    mapping(address => bool) public burners;

    // Storage - using TBA addresses
    mapping(address => uint256[]) public boxes; // TBA => box IDs

    // Events
    event MintBox(address indexed user, address indexed tba, uint256 tokenId);
    event Burn(address indexed user, address indexed tba, uint256 tokenId);
    event BoxPriceUpdated(uint256 newPrice);
    event PaymentGatewayUpdated(address newGateway);

    constructor(
        address _foodNFT,
        address _foodScramble,
        address _paymentGateway
    ) ERC721("Special Box", "BOX") Ownable(msg.sender) {
        foodNFT = IFoodNFT(_foodNFT);
        foodScramble = IFoodScramble(_foodScramble);
        paymentGateway = IPaymentGateway(_paymentGateway);
    }

    modifier onlyBurner() {
        require(burners[msg.sender], "Not authorized");
        _;
    }

    // === MINT FUNCTION ===

    /**
     * @notice Mint satu box dengan memburn 10 hamburger
     * @dev Cek 10 hamburger di TBA, burn, lalu mint box
     * @return tokenId yang di-mint
     */
    function mintBox() external payable nonReentrant returns (uint256) {
        address tba = _getTBA(msg.sender);

        // Cek hamburger cukup (minimal 10)
        require(hasEnoughHamburgers(tba), "Need 10 hamburgers");

        // Cek ETH payment jika diperlukan
        if (boxPrice > 0) {
            require(address(paymentGateway) != address(0), "Payment gateway not set");
            require(msg.value >= boxPrice, "Insufficient payment");
            paymentGateway.processPayment{ value: boxPrice }();

            // Refund excess
            if (msg.value > boxPrice) {
                payable(msg.sender).transfer(msg.value - boxPrice);
            }
        }

        // Burn 10 hamburgers
        burnHamburgers(tba);

        // Mint box ke TBA
        _tokenIds++;
        uint256 tokenId = _tokenIds;

        // Mint directly without triggering _beforeTokenTransfer for boxes array
        _mint(tba, tokenId);

        // Manually add to boxes array only once
        boxes[tba].push(tokenId);

        emit MintBox(msg.sender, tba, tokenId);

        return tokenId;
    }

    // === HAMBURGER FUNCTIONS ===

    /**
     * @notice Cek apakah TBA punya minimal 10 hamburger
     * @param tba Address TBA yang dicek
     * @return true jika punya >= 10 hamburger
     */
    function hasEnoughHamburgers(address tba) public view returns (bool) {
        uint256[] memory foods = foodNFT.getMyFoods(tba);
        return foods.length >= HAMBURGER_COST;
    }

    /**
     * @notice Burn 10 hamburger dari TBA
     * @param tba Address TBA
     */
    function burnHamburgers(address tba) internal {
        uint256[] memory foods = foodNFT.getMyFoods(tba);
        require(foods.length >= HAMBURGER_COST, "Not enough hamburgers");

        // Burn 10 food NFT pertama
        for (uint256 i = 0; i < HAMBURGER_COST; i++) {
            foodNFT.burnFood(foods[i]);
        }
    }

    // === BURN FUNCTIONS ===

    /**
     * @notice Burn box by token ID
     */
    function burnBox(uint256 tokenId) external onlyBurner {
        require(_ownerOf(tokenId) != address(0), "Box not exist");

        address tba = ownerOf(tokenId);
        address user = _getUser(tba);

        _update(address(0), tokenId, address(0));
        _removeFromArray(boxes[tba], tokenId);

        emit Burn(user, tba, tokenId);
    }

    // === VIEW FUNCTIONS ===

    /**
     * @notice Get TBA's box balance
     * @param tba TBA address
     * @return Array of box token IDs
     */
    function boxBalance(address tba) external view returns (uint256[] memory) {
        return boxes[tba];
    }

    /**
     * @notice Get user's TBA address
     */
    function getTBA(address user) external view returns (address) {
        return _getTBA(user);
    }

    /**
     * @notice Check berapa box yang bisa di-mint dari TBA
     * @param tba TBA address
     * @return Jumlah box yang bisa di-mint
     */
    function canMint(address tba) external view returns (uint256) {
        uint256[] memory foods = foodNFT.getMyFoods(tba);
        return foods.length / HAMBURGER_COST;
    }

    /**
     * @notice Get total cost untuk mint
     * @return ethCost ETH cost per box
     */
    function getMintCost() external view returns (uint256 ethCost) {
        return boxPrice;
    }

    /**
     * @notice Get current box price
     */
    function getBoxPrice() external view returns (uint256) {
        return boxPrice;
    }

    /**
     * @notice Get total supply
     */
    function total() external view returns (uint256) {
        return _tokenIds;
    }

    // === ADMIN FUNCTIONS ===

    /**
     * @notice Add burner
     */
    function addBurner(address burner) external onlyOwner {
        burners[burner] = true;
    }

    /**
     * @notice Remove burner
     */
    function removeBurner(address burner) external onlyOwner {
        burners[burner] = false;
    }

    /**
     * @notice Set box price
     */
    function setBoxPrice(uint256 _boxPrice) external onlyOwner {
        boxPrice = _boxPrice;
        emit BoxPriceUpdated(_boxPrice);
    }

    /**
     * @notice Set payment gateway
     */
    function setPaymentGateway(address _paymentGateway) external onlyOwner {
        paymentGateway = IPaymentGateway(_paymentGateway);
        emit PaymentGatewayUpdated(_paymentGateway);
    }

    /**
     * @notice Set food NFT contract
     */
    function setFoodNFT(address _foodNFT) external onlyOwner {
        foodNFT = IFoodNFT(_foodNFT);
    }

    /**
     * @notice Set food scramble contract
     */
    function setFoodScramble(address _foodScramble) external onlyOwner {
        foodScramble = IFoodScramble(_foodScramble);
    }

    // === INTERNAL FUNCTIONS ===

    function _getTBA(address user) internal view returns (address) {
        if (address(foodScramble) != address(0) && foodScramble.accountReady(user)) {
            return foodScramble.getTBA(user);
        }
        return user;
    }

    function _getUser(address tba) internal pure returns (address) {
        // Simplified - dalam implementasi nyata butuh reverse mapping
        return tba;
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

    // Override _update to prevent duplicate box entries
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = super._update(to, tokenId, auth);

        // Only handle transfers, not mints (from != address(0))
        // Mints are handled manually in mintBox()
        if (from != address(0)) {
            _removeFromArray(boxes[from], tokenId);
        }

        // Only add to boxes array for transfers, not for mints
        // Mints are handled manually in mintBox()
        if (to != address(0) && from != address(0)) {
            boxes[to].push(tokenId);
        }

        return from;
    }
}
