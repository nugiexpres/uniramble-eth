// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IFoodNFT
 * @dev interface untuk kontrak Food NFT.
 * Fungsi ini memungkinkan untuk mengambil semua token ID makanan yang dimiliki oleh suatu alamat.
 */
interface IFoodNFT {
    /**
     * @notice Mengambil daftar ID token makanan yang dimiliki oleh suatu alamat.
     * @param owner Alamat yang ingin diperiksa kepemilikannya.
     * @return uint256[] Sebuah array yang berisi ID token makanan yang dimiliki oleh `owner`.
     */
    function getMyFoods(address owner) external view returns (uint256[] memory);
}
