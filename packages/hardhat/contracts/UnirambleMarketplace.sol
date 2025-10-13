// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract UnirambleMarketplace is Ownable {
    struct Listing {
        address seller;
        address token;
        uint256 amount;
        uint256 pricePerToken; // in wei
        bool active;
    }

    Listing[] public listings;
    address[] public trackedTokens;
    mapping(address => bool) public isTracked;

    constructor() Ownable(msg.sender) {}

    // Mapping untuk menyimpan harga fix (0 = tidak ada harga fix)
    mapping(address => uint256) public fixedPrices;

    uint256 public constant FEE_PERCENT = 10;

    event TokenListed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed token,
        uint256 amount,
        uint256 pricePerToken
    );
    event TokenPurchased(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 amount,
        uint256 totalPaid,
        uint256 fee
    );
    event ListingCancelled(uint256 indexed listingId);
    event ListingUpdated(uint256 indexed listingId, uint256 newPrice);
    event TokenTracked(address indexed token, uint256 fixedPrice);

    /// --------------------------
    /// PUBLIC FUNCTIONS
    /// --------------------------

    /**
     * @notice Owner menambahkan token tracked sekaligus set harga fix (bisa 0 jika tidak ada harga fix)
     */
    function addTrackedToken(address token, uint256 fixedPrice) external onlyOwner {
        require(!isTracked[token], "Already tracked");
        isTracked[token] = true;
        trackedTokens.push(token);

        if (fixedPrice > 0) {
            fixedPrices[token] = fixedPrice;
        }

        emit TokenTracked(token, fixedPrice);
    }

    function listToken(address token, uint256 amount, uint256 pricePerToken) external {
        require(isTracked[token], "Token not tracked");
        require(amount > 0, "Invalid amount");

        // Jika ada fixedPrice untuk token ini, maka listing harus pakai harga fix itu
        uint256 fixedPrice = fixedPrices[token];
        if (fixedPrice > 0) {
            require(pricePerToken == fixedPrice, "Price must match fixed price");
        } else {
            require(pricePerToken > 0, "Invalid price");
        }

        IERC20(token).transferFrom(msg.sender, address(this), amount);

        listings.push(
            Listing({ seller: msg.sender, token: token, amount: amount, pricePerToken: pricePerToken, active: true })
        );

        emit TokenListed(listings.length - 1, msg.sender, token, amount, pricePerToken);
    }

    function buyToken(uint256 listingId, uint256 amountToBuy) external payable {
        Listing storage listing = listings[listingId];
        require(listing.active, "Inactive listing");
        require(amountToBuy > 0 && amountToBuy <= listing.amount, "Invalid amount");

        uint256 totalPrice = listing.pricePerToken * amountToBuy;
        require(msg.value >= totalPrice, "Insufficient ETH");

        uint256 fee = (totalPrice * FEE_PERCENT) / 100;
        uint256 sellerAmount = totalPrice - fee;

        listing.amount -= amountToBuy;
        if (listing.amount == 0) listing.active = false;

        IERC20(listing.token).transfer(msg.sender, amountToBuy);
        payable(listing.seller).transfer(sellerAmount);
        payable(owner()).transfer(fee);

        emit TokenPurchased(listingId, msg.sender, amountToBuy, totalPrice, fee);
    }

    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.active, "Already inactive");
        require(msg.sender == listing.seller, "Not your listing");

        listing.active = false;
        IERC20(listing.token).transfer(listing.seller, listing.amount);

        emit ListingCancelled(listingId);
    }

    function updateListingPrice(uint256 listingId, uint256 newPrice) external {
        Listing storage listing = listings[listingId];
        require(listing.active, "Inactive listing");
        require(msg.sender == listing.seller, "Not your listing");

        // Jika token ada fixedPrice, harga tidak bisa diubah
        uint256 fixedPrice = fixedPrices[listing.token];
        require(fixedPrice == 0, "Price is fixed, cannot update");
        require(newPrice > 0, "Invalid price");

        listing.pricePerToken = newPrice;

        emit ListingUpdated(listingId, newPrice);
    }

    /// --------------------------
    /// VIEW FUNCTIONS
    /// --------------------------

    function getTrackedTokens() external view returns (address[] memory) {
        return trackedTokens;
    }

    function listingCounter() external view returns (uint256) {
        return listings.length;
    }

    function getListing(uint256 index) external view returns (Listing memory) {
        return listings[index];
    }

    function listingsLength() public view returns (uint256) {
        return listings.length;
    }

    function getFixedPrice(address token) external view returns (uint256) {
        return fixedPrices[token];
    }

    /**
     * @notice Fungsi batch untuk mendapatkan fixedPrices sekaligus untuk banyak token
     */
    function getFixedPrices(address[] calldata tokens) external view returns (uint256[] memory) {
        uint256[] memory prices = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            prices[i] = fixedPrices[tokens[i]];
        }
        return prices;
    }

    function getListings(uint256 from, uint256 to) external view returns (Listing[] memory) {
        require(to >= from && to <= listings.length, "Invalid range");
        Listing[] memory result = new Listing[](to - from);
        for (uint256 i = from; i < to; i++) {
            result[i - from] = listings[i];
        }
        return result;
    }
}
