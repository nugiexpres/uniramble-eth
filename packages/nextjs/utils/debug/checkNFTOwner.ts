/**
 * Debug utility to check NFT ownership
 * Run this in browser console to verify where NFT was minted
 */

export const checkNFTOwnership = async (
  foodNFTAddress: string,
  foodNFTAbi: any,
  provider: any,
  smartAccountAddress: string,
  eoaAddress: string,
  tokenId: number = 0,
) => {
  try {
    const { ethers } = await import("ethers");
    const foodNFT = new ethers.Contract(foodNFTAddress, foodNFTAbi, provider);

    console.log("🔍 Checking NFT Ownership...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // 1. Check owner of tokenId
    try {
      const owner = await foodNFT.ownerOf(tokenId);
      console.log("\n1️⃣ Owner of tokenId", tokenId);
      console.log("   Owner:", owner);
      console.log("   Smart Account:", smartAccountAddress);
      console.log("   EOA Wallet:", eoaAddress);
      console.log("   ✅ Matches Smart Account:", owner.toLowerCase() === smartAccountAddress.toLowerCase());
      console.log("   ❌ Matches EOA:", owner.toLowerCase() === eoaAddress.toLowerCase());
    } catch (err: any) {
      console.log("\n1️⃣ Owner of tokenId", tokenId);
      console.log("   ❌ Error:", err.message);
      console.log("   (Token might not exist yet)");
    }

    // 2. Check mynfts mapping for Smart Account
    try {
      const smartAccountNFTs = await foodNFT.getMyNFTs(smartAccountAddress);
      console.log("\n2️⃣ Smart Account NFTs (mynfts mapping)");
      console.log("   Count:", smartAccountNFTs.length);
      console.log(
        "   Token IDs:",
        smartAccountNFTs.map((id: any) => id.toString()),
      );
    } catch (err: any) {
      console.log("\n2️⃣ Smart Account NFTs");
      console.log("   ❌ Error:", err.message);
    }

    // 3. Check mynfts mapping for EOA
    try {
      const eoaNFTs = await foodNFT.getMyNFTs(eoaAddress);
      console.log("\n3️⃣ EOA Wallet NFTs (mynfts mapping)");
      console.log("   Count:", eoaNFTs.length);
      console.log(
        "   Token IDs:",
        eoaNFTs.map((id: any) => id.toString()),
      );
    } catch (err: any) {
      console.log("\n3️⃣ EOA Wallet NFTs");
      console.log("   ❌ Error:", err.message);
    }

    // 4. Check minted flag for Smart Account
    try {
      const smartAccountMinted = await foodNFT.chefMinted(smartAccountAddress);
      console.log("\n4️⃣ Smart Account Minted Flag");
      console.log("   Has Minted:", smartAccountMinted);
    } catch (err: any) {
      console.log("\n4️⃣ Smart Account Minted Flag");
      console.log("   ❌ Error:", err.message);
    }

    // 5. Check minted flag for EOA
    try {
      const eoaMinted = await foodNFT.chefMinted(eoaAddress);
      console.log("\n5️⃣ EOA Wallet Minted Flag");
      console.log("   Has Minted:", eoaMinted);
    } catch (err: any) {
      console.log("\n5️⃣ EOA Wallet Minted Flag");
      console.log("   ❌ Error:", err.message);
    }

    // 6. Check balance
    try {
      const smartAccountBalance = await foodNFT.balanceOf(smartAccountAddress);
      const eoaBalance = await foodNFT.balanceOf(eoaAddress);
      console.log("\n6️⃣ NFT Balances");
      console.log("   Smart Account Balance:", smartAccountBalance.toString());
      console.log("   EOA Wallet Balance:", eoaBalance.toString());
    } catch (err: any) {
      console.log("\n6️⃣ NFT Balances");
      console.log("   ❌ Error:", err.message);
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Ownership check complete!");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("❌ Error checking NFT ownership:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Export for easy use in console
if (typeof window !== "undefined") {
  (window as any).checkNFTOwnership = checkNFTOwnership;
}
