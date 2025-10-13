// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract UniPass is ERC721, Ownable {
    uint256 private _tokenIds;

    // Base URI for IPFS metadata
    string private baseTokenURI;

    // SpecialBoxManager sebagai minter
    address public minter;

    event MinterUpdated(address indexed newMinter);
    event BaseURIUpdated(string newBaseURI);

    modifier onlyMinter() {
        require(msg.sender == minter, "Not authorized minter");
        _;
    }

    constructor(string memory baseURI_) ERC721("UniPass", "UPASS") Ownable(msg.sender) {
        baseTokenURI = baseURI_;
    }

    /// @notice Set SpecialBoxManager sebagai minter resmi
    function setMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "Invalid minter");
        minter = _minter;
        emit MinterUpdated(_minter);
    }

    /// @notice Update base URI (misalnya IPFS CID baru)
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /// @notice Mint NFT UniPass untuk user (hanya SpecialBoxManager)
    function mintUniPass(address to) external onlyMinter returns (uint256) {
        uint256 newId = _tokenIds;
        _tokenIds++;
        _safeMint(to, newId);
        return newId;
    }

    /// @notice BaseURI override untuk metadata IPFS
    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }
}
