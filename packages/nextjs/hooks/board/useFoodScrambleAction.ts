import { useState } from "react";
// import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { useSmartAccountTBA } from "~~/hooks/envio/useSmartAccountTBA";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface UseFoodScrambleActionProps {
  onMoveSuccess?: () => void;
  onIngredientBuySuccess?: () => void;
  onFoodMintSuccess?: () => void;
  onFaucetUseSuccess?: () => void;
  onTBACreationSuccess?: (tbaAddress: string) => void;
  onUsernameSetSuccess?: () => void;
  enableAutoRefetch?: boolean;
}

export const useFoodScrambleAction = ({
  onMoveSuccess,
  onIngredientBuySuccess,
  onFoodMintSuccess,
  onFaucetUseSuccess,
  onTBACreationSuccess,
  onUsernameSetSuccess,
}: UseFoodScrambleActionProps = {}) => {
  const { address: userAddress } = useAccount();

  // Get Smart Account TBA (priority over EOA)
  const { tbaAddress: smartAccountTbaAddress } = useSmartAccountTBA();

  // Use Smart Account TBA if available, otherwise fallback to EOA
  const effectiveUserAddress = smartAccountTbaAddress || userAddress;

  // State management
  const [isMoving, setIsMoving] = useState(false);
  const [isBuyingIngredient, setIsBuyingIngredient] = useState(false);
  const [isMintingFood, setIsMintingFood] = useState(false);
  const [isMintingSpecialBox] = useState(false);
  const [isUsingFaucet, setIsUsingFaucet] = useState(false);
  const [isCreatingTBA, setIsCreatingTBA] = useState(false);
  const [isSettingUsername, setIsSettingUsername] = useState(false);
  const [isTravelingRail, setIsTravelingRail] = useState(false);
  const [isBurningIngredients, setIsBurningIngredients] = useState(false);

  // Write contract hooks
  const { writeContractAsync: writeContract } = useScaffoldWriteContract("FoodScramble");

  // 🎲 PLAYER MOVEMENT ACTIONS

  /**
   * Move player on the board (roll dice)
   */
  const movePlayer = async () => {
    if (!userAddress) {
      notification.error("Wallet not connected");
      return { success: false, message: "Wallet not connected" };
    }

    try {
      setIsMoving(true);

      const txHash = await writeContract({
        functionName: "movePlayer",
      });

      notification.success("Player moved successfully!");
      onMoveSuccess?.();

      return {
        success: true,
        message: "Player moved successfully",
        txHash,
      };
    } catch (error: any) {
      let errorMessage = "Failed to move player";
      if (error.message?.includes("TBA not found")) errorMessage = "TBA not found - create account first";
      else if (error.message?.includes("user rejected")) errorMessage = "Transaction cancelled by user";
      else if (error.message?.includes("insufficient funds")) errorMessage = "Insufficient funds for gas";
      else if (error.message) errorMessage = error.message;

      notification.error(`Move failed: ${errorMessage}`);
      return { success: false, message: errorMessage };
    } finally {
      setIsMoving(false);
    }
  };

  /**
   * Travel using rail system
   */
  const travelRail = async () => {
    if (!userAddress) {
      notification.error("Wallet not connected");
      return { success: false, message: "Wallet not connected" };
    }

    try {
      setIsTravelingRail(true);

      const txHash = await writeContract({
        functionName: "travelRail",
      });

      notification.success("Rail travel successful!");
      onMoveSuccess?.();

      return {
        success: true,
        message: "Rail travel successful",
        txHash,
      };
    } catch (error: any) {
      let errorMessage = "Failed to travel by rail";
      if (error.message?.includes("Go to Rail Grid")) errorMessage = "You must be on a Rail grid to travel";
      else if (error.message?.includes("user rejected")) errorMessage = "Transaction cancelled by user";
      else if (error.message?.includes("insufficient funds")) errorMessage = "Insufficient funds for gas";
      else if (error.message) errorMessage = error.message;

      notification.error(`Rail travel failed: ${errorMessage}`);
      return { success: false, message: errorMessage };
    } finally {
      setIsTravelingRail(false);
    }
  };

  // 🛒 INGREDIENT ACTIONS

  /**
   * Buy ingredient at current position (now free)
   */
  const buyIngredient = async () => {
    if (!userAddress) {
      notification.error("Wallet not connected");
      return { success: false, message: "Wallet not connected" };
    }

    try {
      setIsBuyingIngredient(true);

      const txHash = await writeContract({
        functionName: "buyIngredient",
      });

      notification.success("Ingredient purchased successfully!");
      onIngredientBuySuccess?.();

      return {
        success: true,
        message: "Ingredient purchased successfully",
        txHash,
      };
    } catch (error: any) {
      let errorMessage = "Failed to buy ingredient";
      if (error.message?.includes("TBA not found")) errorMessage = "TBA not found - create account first";
      else if (error.message?.includes("already brought ingredient"))
        errorMessage = "Already bought ingredient at this position";
      else if (error.message?.includes("Not an ingredient grid")) errorMessage = "Not at an ingredient location";
      else if (error.message?.includes("Insufficient payment")) errorMessage = "Insufficient payment for ingredient";
      else if (error.message?.includes("Payment processing failed")) errorMessage = "Payment processing failed";
      else if (error.message?.includes("user rejected")) errorMessage = "Transaction cancelled by user";
      else if (error.message?.includes("insufficient funds")) errorMessage = "Insufficient funds";
      else if (error.message) errorMessage = error.message;

      notification.error(`Purchase failed: ${errorMessage}`);
      return { success: false, message: errorMessage };
    } finally {
      setIsBuyingIngredient(false);
    }
  };

  /**
   * Burn old ingredients (testing function)
   */
  const burnOldIngredients = async () => {
    if (!userAddress) {
      notification.error("Wallet not connected");
      return { success: false, message: "Wallet not connected" };
    }

    try {
      setIsBurningIngredients(true);

      const txHash = await writeContract({
        functionName: "burnOldIngredients",
      });

      notification.success("Old ingredients burned successfully!");

      return {
        success: true,
        message: "Old ingredients burned successfully",
        txHash,
      };
    } catch (error: any) {
      let errorMessage = "Failed to burn ingredients";
      if (error.message?.includes("user rejected")) errorMessage = "Transaction cancelled by user";
      else if (error.message?.includes("insufficient funds")) errorMessage = "Insufficient funds for gas";
      else if (error.message) errorMessage = error.message;

      notification.error(`Burn failed: ${errorMessage}`);
      return { success: false, message: errorMessage };
    } finally {
      setIsBurningIngredients(false);
    }
  };

  // 🍔 FOOD NFT ACTIONS

  /**
   * Mint food NFT (hamburger)
   */
  const mintFoodNFT = async () => {
    if (!userAddress) {
      notification.error("Wallet not connected");
      return { success: false, message: "Wallet not connected" };
    }

    try {
      setIsMintingFood(true);

      const txHash = await writeContract({
        functionName: "mintFoodNFT",
      });

      notification.success("Food NFT minted successfully!");
      onFoodMintSuccess?.();

      return {
        success: true,
        message: "Food NFT minted successfully",
        txHash,
      };
    } catch (error: any) {
      let errorMessage = "Failed to mint food NFT";
      if (error.message?.includes("You need more bread")) errorMessage = "You need more bread";
      else if (error.message?.includes("You need more meat")) errorMessage = "You need more meat";
      else if (error.message?.includes("You need more lettuce")) errorMessage = "You need more lettuce";
      else if (error.message?.includes("You need more tomato")) errorMessage = "You need more tomato";
      else if (error.message?.includes("user rejected")) errorMessage = "Transaction cancelled by user";
      else if (error.message?.includes("insufficient funds")) errorMessage = "Insufficient funds for gas";
      else if (error.message) errorMessage = error.message;

      notification.error(`Food mint failed: ${errorMessage}`);
      return { success: false, message: errorMessage };
    } finally {
      setIsMintingFood(false);
    }
  };

  // FAUCET ACTIONS

  /**
   * Use faucet to get ETH
   */
  const useFaucetMon = async () => {
    if (!userAddress) {
      notification.error("Wallet not connected");
      return { success: false, message: "Wallet not connected" };
    }

    try {
      setIsUsingFaucet(true);

      const txHash = await writeContract({
        functionName: "useFaucetMon",
      });

      notification.success("Faucet used successfully!");
      onFaucetUseSuccess?.();

      return {
        success: true,
        message: "Faucet used successfully",
        txHash,
      };
    } catch (error: any) {
      let errorMessage = "Failed to use faucet";
      if (error.message?.includes("must on stove")) errorMessage = "Must be on a Stove to use faucet";
      else if (error.message?.includes("Faucet already used")) errorMessage = "Faucet cooldown active - please wait";
      else if (error.message?.includes("user rejected")) errorMessage = "Transaction cancelled by user";
      else if (error.message?.includes("insufficient funds")) errorMessage = "Insufficient funds for gas";
      else if (error.message) errorMessage = error.message;

      notification.error(`Faucet failed: ${errorMessage}`);
      return { success: false, message: errorMessage };
    } finally {
      setIsUsingFaucet(false);
    }
  };

  // 🏗️ ACCOUNT SETUP ACTIONS

  /**
   * Create Token Bound Account (TBA)
   */
  const createTokenBoundAccount = async (
    implementation: string,
    chainId: bigint,
    tokenContract: string,
    tokenId: bigint,
    salt: bigint,
    initData: `0x${string}` = "0x",
  ) => {
    if (!userAddress) {
      notification.error("Wallet not connected");
      return { success: false, message: "Wallet not connected" };
    }

    try {
      setIsCreatingTBA(true);

      const txHash = await writeContract({
        functionName: "createTokenBoundAccount",
        args: [implementation, chainId, tokenContract, tokenId, salt, initData],
      });

      notification.success("Token Bound Account created successfully!");

      // Note: To get the actual TBA address, you'd need to listen to the event
      // or calculate it using the registry's account function
      onTBACreationSuccess?.("TBA created");

      return {
        success: true,
        message: "Token Bound Account created successfully",
        txHash,
      };
    } catch (error: any) {
      let errorMessage = "Failed to create TBA";
      if (error.message?.includes("Already registered")) errorMessage = "Player already registered";
      else if (error.message?.includes("user rejected")) errorMessage = "Transaction cancelled by user";
      else if (error.message?.includes("insufficient funds")) errorMessage = "Insufficient funds for gas";
      else if (error.message) errorMessage = error.message;

      notification.error(`TBA creation failed: ${errorMessage}`);
      return { success: false, message: errorMessage };
    } finally {
      setIsCreatingTBA(false);
    }
  };

  /**
   * Set username for player
   */
  const setUsername = async (username: string) => {
    if (!userAddress) {
      notification.error("Wallet not connected");
      return { success: false, message: "Wallet not connected" };
    }

    if (!username || username.trim().length === 0) {
      notification.error("Username cannot be empty");
      return { success: false, message: "Username cannot be empty" };
    }

    try {
      setIsSettingUsername(true);

      const txHash = await writeContract({
        functionName: "setUsername",
        args: [username.trim()],
      });

      notification.success("Username set successfully!");
      onUsernameSetSuccess?.();

      return {
        success: true,
        message: "Username set successfully",
        txHash,
      };
    } catch (error: any) {
      let errorMessage = "Failed to set username";
      if (error.message?.includes("Username already set")) errorMessage = "Username already set for this account";
      else if (error.message?.includes("user rejected")) errorMessage = "Transaction cancelled by user";
      else if (error.message?.includes("insufficient funds")) errorMessage = "Insufficient funds for gas";
      else if (error.message) errorMessage = error.message;

      notification.error(`Username setting failed: ${errorMessage}`);
      return { success: false, message: errorMessage };
    } finally {
      setIsSettingUsername(false);
    }
  };

  /**
   * Set TBA manually (if needed)
   */
  const setTBA = async (user: string, tba: string) => {
    if (!userAddress) {
      notification.error("Wallet not connected");
      return { success: false, message: "Wallet not connected" };
    }

    try {
      const txHash = await writeContract({
        functionName: "setTBA",
        args: [user, tba],
      });

      notification.success("TBA set successfully!");

      return {
        success: true,
        message: "TBA set successfully",
        txHash,
      };
    } catch (error: any) {
      let errorMessage = "Failed to set TBA";
      if (error.message?.includes("user rejected")) errorMessage = "Transaction cancelled by user";
      else if (error.message?.includes("insufficient funds")) errorMessage = "Insufficient funds for gas";
      else if (error.message) errorMessage = error.message;

      notification.error(`TBA setting failed: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  };

  // 🧪 TESTING/OWNER ACTIONS

  /**
   * Use faucets for testing (owner only)
   */
  const useFaucets = async () => {
    if (!userAddress) {
      notification.error("Wallet not connected");
      return { success: false, message: "Wallet not connected" };
    }

    try {
      const txHash = await writeContract({
        functionName: "faucets",
      });

      notification.success("Testing faucets used successfully!");

      return {
        success: true,
        message: "Testing faucets used successfully",
        txHash,
      };
    } catch (error: any) {
      let errorMessage = "Failed to use testing faucets";
      if (error.message?.includes("Not the Owner")) errorMessage = "Only owner can use testing faucets";
      else if (error.message?.includes("user rejected")) errorMessage = "Transaction cancelled by user";
      else if (error.message?.includes("insufficient funds")) errorMessage = "Insufficient funds for gas";
      else if (error.message) errorMessage = error.message;

      notification.error(`Testing faucets failed: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  };

  /**
   * Reset player progress (owner only)
   */
  const resetPlayerProgress = async (playerAddress: string) => {
    if (!userAddress) {
      notification.error("Wallet not connected");
      return { success: false, message: "Wallet not connected" };
    }

    try {
      const txHash = await writeContract({
        functionName: "resetPlayerProgress",
        args: [playerAddress],
      });

      notification.success("Player progress reset successfully!");

      return {
        success: true,
        message: "Player progress reset successfully",
        txHash,
      };
    } catch (error: any) {
      let errorMessage = "Failed to reset player progress";
      if (error.message?.includes("Only owner can reset")) errorMessage = "Only owner can reset player progress";
      else if (error.message?.includes("user rejected")) errorMessage = "Transaction cancelled by user";
      else if (error.message?.includes("insufficient funds")) errorMessage = "Insufficient funds for gas";
      else if (error.message) errorMessage = error.message;

      notification.error(`Reset failed: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  };

  // 🛠️ HELPER FUNCTIONS

  /**
   * Calculate estimated gas for ingredient purchase (now free)
   */
  const getIngredientPurchaseValue = (): bigint => {
    return 0n; // Ingredients are now free
  };

  /**
   * Calculate estimated gas for special box mint
   */
  const getSpecialBoxMintValue = (boxFee: bigint): bigint => {
    return boxFee > 0n ? boxFee : 0n;
  };

  /**
   * Check if all actions are idle
   */
  const isIdle = (): boolean => {
    return (
      !isMoving &&
      !isBuyingIngredient &&
      !isMintingFood &&
      !isMintingSpecialBox &&
      !isUsingFaucet &&
      !isCreatingTBA &&
      !isSettingUsername &&
      !isTravelingRail &&
      !isBurningIngredients
    );
  };

  /**
   * Get current action status
   */
  const getCurrentAction = (): string | null => {
    if (isMoving) return "Moving player...";
    if (isBuyingIngredient) return "Buying ingredient...";
    if (isMintingFood) return "Minting food NFT...";
    if (isMintingSpecialBox) return "Minting special box...";
    if (isUsingFaucet) return "Using faucet...";
    if (isCreatingTBA) return "Creating TBA...";
    if (isSettingUsername) return "Setting username...";
    if (isTravelingRail) return "Traveling by rail...";
    if (isBurningIngredients) return "Burning ingredients...";
    return null;
  };

  return {
    // Loading States
    isMoving,
    isBuyingIngredient,
    isMintingFood,
    isMintingSpecialBox,
    isUsingFaucet,
    isCreatingTBA,
    isSettingUsername,
    isTravelingRail,
    isBurningIngredients,
    // Player Movement Actions
    movePlayer,
    travelRail,
    // Ingredient Actions
    buyIngredient,
    burnOldIngredients,
    // Food NFT Actions
    mintFoodNFT,
    // Faucet Actions
    useFaucetMon,
    // Account Setup Actions
    createTokenBoundAccount,
    setUsername,
    setTBA,
    // Testing/Owner Actions
    useFaucets,
    resetPlayerProgress,
    // Helper Functions
    getIngredientPurchaseValue,
    getSpecialBoxMintValue,
    isIdle,
    getCurrentAction,

    // Smart Account TBA info
    smartAccountTbaAddress,
    effectiveUserAddress,
    usingSmartAccountTBA: !!smartAccountTbaAddress,
  };
};

// Export types for better TypeScript support
export interface FoodScrambleActionResult {
  success: boolean;
  message: string;
  txHash?: string;
}

export interface TBACreationParams {
  implementation: string;
  chainId: bigint;
  tokenContract: string;
  tokenId: bigint;
  salt: bigint;
  initData?: `0x${string}`;
}
