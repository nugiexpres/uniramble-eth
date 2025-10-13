// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IUniPass {
    /// @notice Mint NFT UniPass untuk user (hanya minter yang bisa memanggil)
    /// @param to Address yang akan menerima NFT
    /// @return tokenId ID token yang baru dibuat
    function mintUniPass(address to) external returns (uint256);
    
    /// @notice Set SpecialBoxManager sebagai minter resmi (hanya owner)
    /// @param _minter Address yang akan dijadikan minter
    function setMinter(address _minter) external;
    
    /// @notice Update base URI untuk metadata (hanya owner)
    /// @param _baseURI Base URI baru untuk IPFS metadata
    function setBaseURI(string calldata _baseURI) external;
    
    /// @notice Cek owner dari token tertentu
    /// @param tokenId ID token yang akan dicek
    /// @return owner Address pemilik token
    function ownerOf(uint256 tokenId) external view returns (address owner);
    
    /// @notice Cek balance NFT user
    /// @param owner Address yang akan dicek
    /// @return balance Jumlah NFT yang dimiliki
    function balanceOf(address owner) external view returns (uint256 balance);
    
    /// @notice Transfer NFT
    /// @param from Address pengirim
    /// @param to Address penerima
    /// @param tokenId ID token yang akan ditransfer
    function transferFrom(address from, address to, uint256 tokenId) external;
    
    /// @notice Safe transfer NFT
    /// @param from Address pengirim
    /// @param to Address penerima
    /// @param tokenId ID token yang akan ditransfer
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    
    /// @notice Safe transfer NFT dengan data
    /// @param from Address pengirim
    /// @param to Address penerima
    /// @param tokenId ID token yang akan ditransfer
    /// @param data Data tambahan untuk transfer
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    
    /// @notice Approve address untuk transfer token tertentu
    /// @param to Address yang akan di-approve
    /// @param tokenId ID token yang akan di-approve
    function approve(address to, uint256 tokenId) external;
    
    /// @notice Get approved address untuk token tertentu
    /// @param tokenId ID token
    /// @return operator Address yang di-approve
    function getApproved(uint256 tokenId) external view returns (address operator);
    
    /// @notice Set approval untuk semua token
    /// @param operator Address operator
    /// @param approved Status approval
    function setApprovalForAll(address operator, bool approved) external;
    
    /// @notice Cek approval status untuk semua token
    /// @param owner Address pemilik
    /// @param operator Address operator
    /// @return approved Status approval
    function isApprovedForAll(address owner, address operator) external view returns (bool approved);
    
    /// @notice Get current minter address
    /// @return minter Address yang saat ini menjadi minter
    function minter() external view returns (address minter);
    
    /// @notice Get contract name
    /// @return name Nama contract
    function name() external view returns (string memory name);
    
    /// @notice Get contract symbol  
    /// @return symbol Symbol contract
    function symbol() external view returns (string memory symbol);
    
    /// @notice Get token URI untuk metadata
    /// @param tokenId ID token
    /// @return uri URI metadata token
    function tokenURI(uint256 tokenId) external view returns (string memory uri);
    
    /// @notice Check apakah interface didukung
    /// @param interfaceId Interface ID yang akan dicek
    /// @return supported Boolean apakah interface didukung
    function supportsInterface(bytes4 interfaceId) external view returns (bool supported);
    
    // Events yang sesuai dengan contract UniPass.sol
    event MinterUpdated(address indexed newMinter);
    event BaseURIUpdated(string newBaseURI);
    
    // Standard ERC721 Events
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
}