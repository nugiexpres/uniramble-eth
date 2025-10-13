// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IPaymentGateway {
    /**
     * @notice Terima pembayaran dari kontrak lain
     * @dev Harus dipanggil dengan msg.value > 0
     */
    function processPayment() external payable;
}
