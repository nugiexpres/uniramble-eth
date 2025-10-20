// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FoodNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;

    mapping(address => uint256[]) public myFoods;

    address public gameContract;

    event FoodBurned(uint256 indexed tokenId, address indexed owner, address indexed burner, uint256 timestamp);
    event FoodMinted(address indexed to, uint256 indexed tokenId, string tokenURI);

    constructor() ERC721("Hamburger", "HAM") Ownable(msg.sender) {
    
    }

    function mintFood(address _to, string memory _tokenURI_) public returns (uint256) {
        require(msg.sender == gameContract, "Only game contract can mint");

        uint256 newItemId = _tokenIds;
        _mint(_to, newItemId);
        _setTokenURI(newItemId, _tokenURI_);

        _tokenIds++;
        myFoods[_to].push(newItemId);
        
        emit FoodMinted(_to, newItemId, _tokenURI_);
        return newItemId;
    }

    function burnFood(uint256 tokenId) external {
        require(
            ownerOf(tokenId) == msg.sender ||
                getApproved(tokenId) == msg.sender ||
                isApprovedForAll(ownerOf(tokenId), msg.sender),
            "Not owner nor approved"
        );

        address owner = ownerOf(tokenId);

        emit FoodBurned(tokenId, owner, msg.sender, block.timestamp);

        _burn(tokenId);

        uint256[] storage foods = myFoods[owner];
        for (uint256 i = 0; i < foods.length; i++) {
            if (foods[i] == tokenId) {
                foods[i] = foods[foods.length - 1];
                foods.pop();
                break;
            }
        }
    }

    function burnFoodBatch(address _owner, uint256[] calldata tokenIds) external {
        require(tokenIds.length > 0, "No tokenIds provided");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];

            require(
                ownerOf(tokenId) == msg.sender ||
                    getApproved(tokenId) == msg.sender ||
                    isApprovedForAll(ownerOf(tokenId), msg.sender),
                "Not owner nor approved"
            );

            require(ownerOf(tokenId) == _owner, "Not token owner");

            emit FoodBurned(tokenId, _owner, msg.sender, block.timestamp);

            _burn(tokenId);

            uint256[] storage foods = myFoods[_owner];
            for (uint256 j = 0; j < foods.length; j++) {
                if (foods[j] == tokenId) {
                    foods[j] = foods[foods.length - 1];
                    foods.pop();
                    break;
                }
            }
        }
    }

    function getMyFoods(address _owner) public view returns (uint256[] memory) {
        return myFoods[_owner];
    }

    function setGameContract(address _gameContract) external onlyOwner {
        gameContract = _gameContract;
    }
}
