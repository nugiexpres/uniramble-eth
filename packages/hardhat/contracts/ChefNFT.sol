// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ChefNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;

    mapping(address => uint256[]) public myChefNFTs;
    mapping(address => bool) public chefMinted;

    address public paymentGateway;
    address public gameContract;
    uint256 public mintPrice = 1 ether;

    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event ChefMinted(address indexed to, uint256 indexed tokenId, string tokenURI);

    constructor(address _paymentGateway) ERC721("Chef NFT", "CHEF") Ownable(msg.sender) {
        paymentGateway = _paymentGateway;
    }

    function mintChef(address _to, string memory _tokenURI_) public payable returns (uint256) {
        require(msg.value == mintPrice, "Mint price not met");

        // Process the payment
        (bool success, ) = address(paymentGateway).call{ value: msg.value }(
            abi.encodeWithSignature("processPayment()")
        );
        require(success, "Payment to PaymentGateway failed");

        uint256 newItemId = _tokenIds;
        _mint(_to, newItemId);
        _setTokenURI(newItemId, _tokenURI_);

        _tokenIds++;
        myChefNFTs[_to].push(newItemId);
        chefMinted[_to] = true;

        emit ChefMinted(_to, newItemId, _tokenURI_);
        return newItemId;
    }

    function isChefMinted(address user) external view returns (bool) {
        return chefMinted[user];
    }

    function getMyChefNFTs(address _owner) public view returns (uint256[] memory) {
        return myChefNFTs[_owner];
    }

    function setMintPrice(uint256 _newPrice) external onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = _newPrice;
        emit MintPriceUpdated(oldPrice, _newPrice);
    }

    function setPaymentGateway(address _paymentGateway) external onlyOwner {
        paymentGateway = _paymentGateway;
    }
}
