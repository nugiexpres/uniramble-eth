import { useAccount } from "wagmi";
import { useFoodTokens } from "~~/hooks/board/useFoodTokens";
import { useSmartAccountTBA } from "~~/hooks/envio/useSmartAccountTBA";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useFinalSmartAccount } from "~~/hooks/smart-account/useFinalSmartAccount";

interface GameControlsProps {
  handleRoll: () => void;
  handleBuy: () => void;
  handleRail: () => void;
  handleCook: () => void;
  handleFaucetMon: (isOnStove: boolean) => void;
  isOnStove: boolean;
  isOnRail?: boolean;
  faucetUsed: boolean;
  canBuy: boolean;
  isModalOpen: boolean;
  playerPosition: number;
  isRolling: boolean;
  isBuying: boolean;
  isRailTraveling?: boolean;
  isCooking?: boolean;
  isUsingFaucet?: boolean;
  ingredientFee: string;
  effectivePosition: number | null;
  tbaAddress: string | undefined;
  currentGrid?: string;
  isMobile?: boolean;
  gridData?: any[]; // gridData to read current grid state
  smartAccountAddress?: string;
}

export const GameControls = ({
  handleRoll,
  handleBuy,
  handleRail,
  handleCook,
  handleFaucetMon,
  faucetUsed,
  canBuy,
  isModalOpen,
  playerPosition,
  isOnStove,
  isRolling,
  isBuying,
  isRailTraveling = false,
  isCooking = false,
  isUsingFaucet = false,
  effectivePosition,
  tbaAddress,
  currentGrid = "",
  isMobile = false,
  gridData = [],
  smartAccountAddress,
}: GameControlsProps) => {
  const scale = isMobile ? "scale-75" : "scale-100";

  // Get connection status and chain info - track wallet changes
  const { address, isConnected } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const currentChain = targetNetwork;

  // Get Smart Account state from connected wallet (like SpecialBox)
  const { smartAccountAddress: connectedSmartAccount, isDeployed: isConnectedSmartAccountDeployed } =
    useFinalSmartAccount();

  // Get Smart Account TBA (reactive to wallet changes - like SpecialBox)
  const { tbaAddress: hookSmartAccountTba } = useSmartAccountTBA();

  // Use ONLY hook data from connected wallet, ignore stale props
  const effectiveSmartAccount = connectedSmartAccount || null;
  const effectiveTbaAddress = hookSmartAccountTba || null;
  const effectiveIsSmartAccountDeployed = isConnectedSmartAccountDeployed;

  // Debug: Log wallet and TBA changes
  console.log("🎮 GameControls Wallet Update:", {
    eoaAddress: address,
    connectedSmartAccount,
    hookSmartAccountTba,
    effectiveTbaAddress,
    effectiveIsSmartAccountDeployed,
    propSmartAccount: smartAccountAddress,
    propTbaAddress: tbaAddress,
  });

  // Get food tokens data using the effective TBA address (Smart Account TBA priority)
  const { breadAmount, meatAmount, lettuceAmount, tomatoAmount } = useFoodTokens(effectiveTbaAddress);

  // Check if all ingredients are available for cooking
  const canCook =
    breadAmount &&
    meatAmount &&
    lettuceAmount &&
    tomatoAmount &&
    breadAmount > 0n &&
    meatAmount > 0n &&
    lettuceAmount > 0n &&
    tomatoAmount > 0n;

  // Get current grid type from gridData based on player position
  const getCurrentGridType = () => {
    if (!gridData || !playerPosition) return "";
    const currentGridItem = gridData.find(item => item.id.toString() === playerPosition.toString());
    return currentGridItem?.typeGrid || "";
  };

  const currentGridType = getCurrentGridType();

  // Synchronize rail and stove states with actual grid position
  const isActuallyOnRail = currentGridType === "Rail";
  // const isOnStove = currentGridType === "Stove";

  // Get grid display text with action-specific messages
  const getGridDisplayText = () => {
    if (isRolling) return "🎲 ROLLING DICE...";
    if (isBuying) return `🛒 BUYING ${currentGrid ? currentGrid.toUpperCase() : "..."}`;
    if (isRailTraveling) return "🚂 TRAVELING...";
    if (isCooking) return "👨‍🍳 COOKING BURGER...";
    if (isUsingFaucet) return "💧 USING FAUCET...";
    if (isOnStove) return "🔥 ON STOVE";
    if (isActuallyOnRail) return "🚂 ON RAIL";
    if (currentGridType) return `📍 ${currentGridType.toUpperCase()}`;
    return "🎮 READY";
  };

  // Dispatch a local event so the frontend analytics can show immediate feedback
  const dispatchLocalGameAction = (actionType: string, payload: Record<string, any> = {}) => {
    try {
      if (typeof window !== "undefined" && window.dispatchEvent) {
        const id = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const optimisticKey = `${actionType}:${(effectiveTbaAddress || "").toLowerCase()}`;

        const detail = {
          id,
          optimisticKey,
          type: actionType,
          player: effectiveTbaAddress || "",
          tbaAddress: effectiveTbaAddress || "",
          data: payload,
          timestamp: Date.now(),
          db_write_timestamp: new Date().toISOString(),
        };

        window.dispatchEvent(new CustomEvent("localGameAction", { detail }));
      }
    } catch (e) {
      console.warn("Failed to dispatch local game action", e);
    }
  };

  // Check if faucet button should be active
  const canUseFaucet = isOnStove && !faucetUsed;

  // Check if rail button should be active
  const canUseRail = isActuallyOnRail;

  return (
    <div className={`flex flex-col items-center space-y-6 ${isMobile ? "p-2" : "p-6"}`}>
      {/* Error notifications handled by toast notifications (top of page) - no duplicate error box needed */}

      {/* PlayStation 5 DualSense Controller */}
      <div className={`relative ${scale} transform transition-all duration-300 hover:scale-90`}>
        {/* Main Controller Body */}
        <div
          className="relative top-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-3xl rounded-b-3xl shadow-2xl border border-slate-300"
          style={{ width: "445px", height: "320px" }}
        >
          {/* Controller Surface Texture */}
          <div className="absolute inset-2 bg-gradient-to-br from-white/80 to-slate-100/80 rounded-t-3xl rounded-b-3xl shadow-inner"></div>

          {/* Connection Status Logo */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            <div
              className={`px-4 py-1 rounded-full text-xs font-medium shadow-lg ${
                isConnected
                  ? effectiveIsSmartAccountDeployed
                    ? "bg-gradient-to-r from-purple-500 to-purple-700 text-white"
                    : "bg-gradient-to-r from-green-500 to-green-700 text-white"
                  : "bg-gradient-to-r from-red-500 to-red-700 text-white"
              }`}
            >
              {isConnected ? (effectiveIsSmartAccountDeployed ? "GASLESS MODE" : "CONNECTED") : "DISCONNECTED"}
            </div>
          </div>

          {/* Chain Info - Show current chain when connected */}
          {isConnected && currentChain && (
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-10">
              <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-lg border border-blue-300">
                {currentChain.name}
              </div>
            </div>
          )}

          {/* Status Label */}
          <div
            className="absolute top-20 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ left: "22%" }}
          >
            <div className="bg-gradient-to-r from-slate-600 to-slate-800 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg border border-slate-500">
              STATUS
            </div>
          </div>

          {/* Controller Label */}
          <div
            className="absolute top-20 right-1/2 transform translate-x-1/2 -translate-y-1/2 z-10"
            style={{ right: "22%" }}
          >
            <div className="bg-gradient-to-r from-slate-600 to-slate-800 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg border border-slate-500">
              CONTROLLER
            </div>
          </div>

          {/* Left Side - Player Status D-Pad */}
          <div className="absolute left-8 top-24 z-10">
            <div className="relative w-32 h-32">
              {/* Enlarged D-Pad Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl shadow-2xl border-2 border-slate-600"></div>

              {/* Position Status (Top) */}
              <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-b from-purple-400 to-purple-600 hover:from-purple-300 hover:to-purple-500 rounded-lg shadow-lg flex flex-col items-center justify-center text-white font-bold border-2 border-purple-300">
                <span className="text-lg font-bold">
                  {effectivePosition?.toString() || playerPosition?.toString() || "0"}
                </span>
                <span className="text-xs">POS</span>
              </div>

              {/* Stove Status (Left) */}
              <div
                className={`absolute left-1 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-lg shadow-lg flex flex-col items-center justify-center font-bold border-2 ${
                  isOnStove
                    ? "bg-gradient-to-r from-orange-400 to-red-500 border-orange-300 text-white shadow-orange-400/50 animate-pulse"
                    : "bg-gradient-to-r from-gray-400 to-gray-600 border-gray-300 text-gray-200"
                }`}
              >
                <span className="text-lg">🔥</span>
                <span className="text-xs">STOVE</span>
              </div>

              {/* Rail Status (Right) */}
              <div
                className={`absolute right-1 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-lg shadow-lg flex flex-col items-center justify-center font-bold border-2 ${
                  isActuallyOnRail
                    ? "bg-gradient-to-r from-blue-400 to-blue-600 border-blue-300 text-white shadow-blue-400/50 animate-pulse"
                    : "bg-gradient-to-r from-gray-400 to-gray-600 border-gray-300 text-gray-200"
                }`}
              >
                <span className="text-lg">🚂</span>
                <span className="text-xs">RAIL</span>
              </div>

              {/* Ingredients Status (Bottom) */}
              <div
                className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-lg shadow-lg flex flex-col items-center justify-center font-bold border-2 ${
                  canCook
                    ? "bg-gradient-to-b from-green-400 to-green-600 border-green-300 text-white shadow-green-400/50 animate-pulse"
                    : "bg-gradient-to-b from-gray-400 to-gray-600 border-gray-300 text-gray-200"
                }`}
              >
                <span className="text-lg">🍔</span>
                <span className="text-xs">INGR</span>
              </div>
            </div>
          </div>

          {/* Right Side - Action Buttons with Protruding Half-Circle Background */}
          <div className="absolute right-8 top-24 z-10">
            <div className="relative w-32 h-32">
              {/* Protruding Half-Circle Background - Top */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-8 bg-gradient-to-b from-slate-600 to-slate-800 rounded-t-full shadow-lg border-2 border-slate-500 border-b-0"></div>

              {/* Protruding Half-Circle Background - Right */}
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-16 bg-gradient-to-r from-slate-600 to-slate-800 rounded-r-full shadow-lg border-2 border-slate-500 border-l-0"></div>

              {/* Protruding Half-Circle Background - Bottom */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-8 bg-gradient-to-t from-slate-600 to-slate-800 rounded-b-full shadow-lg border-2 border-slate-500 border-t-0"></div>

              {/* Protruding Half-Circle Background - Left */}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-8 h-16 bg-gradient-to-l from-slate-600 to-slate-800 rounded-l-full shadow-lg border-2 border-slate-500 border-r-0"></div>

              {/* Central Circle Background */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full shadow-inner border-2 border-slate-500"></div>

              {/* Roll Button (Top) */}
              <button
                className={`absolute top-1 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full shadow-xl transition-all duration-200 active:scale-90 disabled:opacity-50 flex flex-col items-center justify-center font-bold border-3 z-20 ${
                  isRolling
                    ? "bg-gradient-to-b from-green-300 to-green-500 border-green-200 text-white shadow-green-400/70 animate-bounce"
                    : effectiveTbaAddress && effectiveTbaAddress !== "0x0000000000000000000000000000000000000000"
                      ? "bg-gradient-to-b from-green-400 to-green-600 hover:from-green-300 hover:to-green-500 border-green-300 text-white shadow-green-400/50"
                      : "bg-gradient-to-b from-gray-400 to-gray-600 border-gray-300 text-gray-200"
                } ${!isModalOpen && !isRolling && isConnected && effectiveTbaAddress && effectiveTbaAddress !== "0x0000000000000000000000000000000000000000" ? "cursor-pointer" : "cursor-not-allowed"}`}
                onClick={() => {
                  // call provided handler then emit local event for instant analytics
                  try {
                    handleRoll();
                  } finally {
                    dispatchLocalGameAction("movement", { info: "roll" });
                  }
                }}
                disabled={
                  isModalOpen ||
                  isRolling ||
                  !isConnected ||
                  !effectiveTbaAddress ||
                  effectiveTbaAddress === "0x0000000000000000000000000000000000000000"
                }
                title={
                  !effectiveTbaAddress || effectiveTbaAddress === "0x0000000000000000000000000000000000000000"
                    ? "Create TBA first!"
                    : "Roll Dice"
                }
              >
                <span className="text-xl">🎲</span>
              </button>

              {/* Buy Button (Right) */}
              <button
                className={`absolute right-1 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full shadow-xl transition-all duration-200 active:scale-90 flex flex-col items-center justify-center font-bold border-3 z-20 ${
                  canBuy && !isModalOpen && !isBuying && isConnected
                    ? "bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 border-yellow-300 text-white shadow-yellow-400/50 cursor-pointer"
                    : "bg-gradient-to-b from-gray-400 to-gray-600 border-gray-300 text-gray-200 cursor-not-allowed opacity-50"
                } ${isBuying ? "animate-pulse" : ""}`}
                onClick={() => {
                  try {
                    handleBuy();
                  } finally {
                    dispatchLocalGameAction("purchase", { info: "buy" });
                  }
                }}
                disabled={isModalOpen || !canBuy || isBuying || !isConnected}
                title="Buy Ingredient"
              >
                <span className="text-xl">🛒</span>
              </button>

              {/* Cook Button (Bottom) */}
              <button
                className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full shadow-xl transition-all duration-200 active:scale-90 flex flex-col items-center justify-center font-bold border-3 z-20 ${
                  canCook && !isModalOpen && !isCooking && isConnected
                    ? "bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-300 hover:to-orange-500 border-orange-300 text-white shadow-orange-400/50 cursor-pointer"
                    : "bg-gradient-to-b from-gray-400 to-gray-600 border-gray-300 text-gray-200 cursor-not-allowed opacity-50"
                } ${isCooking ? "animate-pulse" : ""}`}
                onClick={() => {
                  try {
                    handleCook();
                  } finally {
                    dispatchLocalGameAction("mint", { info: "cook" });
                  }
                }}
                disabled={isModalOpen || !canCook || isCooking || !isConnected}
                title="Cook (Need all ingredients)"
              >
                <span className="text-xl">👨‍🍳</span>
              </button>

              {/* Rail/Faucet Button (Left) */}
              <button
                className={`absolute left-1 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full shadow-xl transition-all duration-200 active:scale-90 flex flex-col items-center justify-center font-bold border-3 z-20 ${
                  canUseFaucet && isConnected && !isUsingFaucet
                    ? "bg-gradient-to-b from-cyan-400 to-cyan-600 hover:from-cyan-300 hover:to-cyan-500 border-cyan-300 text-white shadow-cyan-400/50 cursor-pointer"
                    : canUseRail && isConnected && !isRailTraveling
                      ? "bg-gradient-to-b from-blue-400 to-blue-600 hover:from-blue-300 hover:to-blue-500 border-blue-300 text-white shadow-blue-400/50 cursor-pointer"
                      : "bg-gradient-to-b from-gray-400 to-gray-600 border-gray-300 text-gray-200 cursor-not-allowed opacity-50"
                } ${isUsingFaucet || isRailTraveling ? "animate-pulse" : ""}`}
                onClick={() => {
                  if (canUseFaucet && isConnected && !isUsingFaucet) {
                    try {
                      handleFaucetMon(isOnStove);
                    } finally {
                      dispatchLocalGameAction("faucet", { info: "faucet" });
                    }
                  } else if (canUseRail && isConnected && !isRailTraveling) {
                    try {
                      handleRail();
                    } finally {
                      dispatchLocalGameAction("rail", { info: "rail" });
                    }
                  }
                }}
                disabled={
                  isModalOpen || !isConnected || (!canUseFaucet && !canUseRail) || isUsingFaucet || isRailTraveling
                }
                title={
                  !isConnected
                    ? "Connect wallet first"
                    : canUseFaucet
                      ? isUsingFaucet
                        ? "Using Faucet..."
                        : "Use Faucet"
                      : canUseRail
                        ? isRailTraveling
                          ? "Traveling..."
                          : "Use Rail"
                        : "Move to Stove or Rail"
                }
              >
                <span className="text-xl">{canUseFaucet ? "💧" : canUseRail ? "🚂" : "⛔"}</span>
              </button>
            </div>
          </div>

          {/* Left Analog Stick - Bottom Left Corner */}
          <div className="absolute left-4 bottom-4 z-10">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-b from-slate-600 to-slate-800 rounded-full shadow-lg border-4 border-slate-500"></div>
              <div className="absolute top-1 left-1 w-10 h-10 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full shadow-inner flex items-center justify-center">
                <div
                  className={`w-6 h-6 rounded-full shadow-lg ${
                    isConnected
                      ? "bg-gradient-to-b from-green-400 to-green-600 animate-pulse"
                      : "bg-gradient-to-b from-red-400 to-red-600"
                  }`}
                ></div>
              </div>
            </div>
          </div>

          {/* Right Analog Stick - Bottom Right Corner */}
          <div className="absolute right-4 bottom-4 z-10">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-b from-slate-600 to-slate-800 rounded-full shadow-lg border-4 border-slate-500"></div>
              <div className="absolute top-1 left-1 w-10 h-10 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full shadow-inner flex items-center justify-center">
                <div
                  className={`w-6 h-6 rounded-full shadow-lg ${
                    currentChain
                      ? "bg-gradient-to-b from-blue-400 to-blue-600 animate-pulse"
                      : "bg-gradient-to-b from-gray-400 to-gray-600"
                  }`}
                ></div>
              </div>
            </div>
          </div>

          {/* Center Touchpad Area */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-28 h-14 bg-gradient-to-b from-slate-800 to-black rounded-lg shadow-inner border border-slate-600 z-10">
            <div className="flex items-center justify-center h-full">
              <div className="text-white text-xs font-bold">{getGridDisplayText()}</div>
            </div>
          </div>

          {/* LED Light Bar */}
          <div
            className={`absolute top-2 left-1/2 transform -translate-x-1/2 w-40 h-3 rounded-full shadow-lg ${
              isConnected
                ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse"
                : "bg-gradient-to-r from-gray-500 to-gray-700"
            }`}
          ></div>

          {/* Smart Account & TBA Account Info */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-1">
            {/* Smart Account */}
            {isConnected && effectiveIsSmartAccountDeployed && effectiveSmartAccount && (
              <div className="bg-gradient-to-r from-purple-500/40 to-purple-700/40 backdrop-blur-sm border border-purple-400/60 rounded-md px-2 py-1 shadow-lg">
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse"></div>
                  <span className="text-[10px] text-purple-100 font-bold">
                    Smart: {effectiveSmartAccount.slice(0, 4)}...{effectiveSmartAccount.slice(-4)}
                  </span>
                </div>
              </div>
            )}

            {/* TBA Account - Show smart account TBA if deployed, otherwise show message */}
            {isConnected && (
              <>
                {effectiveTbaAddress && hookSmartAccountTba ? (
                  <div className="bg-gradient-to-r from-cyan-500/40 to-cyan-700/40 backdrop-blur-sm border border-cyan-400/60 rounded-md px-2 py-1 shadow-lg">
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-cyan-300 rounded-full animate-pulse"></div>
                      <span className="text-[10px] text-cyan-100 font-bold">
                        TBA: {effectiveTbaAddress.slice(0, 4)}...{effectiveTbaAddress.slice(-4)} ⚡
                      </span>
                    </div>
                  </div>
                ) : effectiveTbaAddress ? (
                  <div className="bg-gradient-to-r from-blue-500/40 to-blue-700/40 backdrop-blur-sm border border-blue-400/60 rounded-md px-2 py-1 shadow-lg">
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse"></div>
                      <span className="text-[10px] text-blue-100 font-bold">
                        TBA: {effectiveTbaAddress.slice(0, 4)}...{effectiveTbaAddress.slice(-4)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-orange-500/40 to-orange-700/40 backdrop-blur-sm border border-orange-400/60 rounded-md px-2 py-1 shadow-lg">
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-pulse"></div>
                      <span className="text-[10px] text-orange-100 font-bold">TBA Not Deployed</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Left Corner Analog Stick - Top Left */}
          <div className="absolute top-4 left-4 z-10">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-b from-purple-300 to-purple-500 rounded-full shadow-lg border-2 border-purple-200"></div>
              <div className="absolute top-0.5 left-0.5 w-7 h-7 bg-gradient-to-b from-purple-200 to-purple-400 rounded-full shadow-inner flex items-center justify-center">
                <div
                  className={`w-4 h-4 rounded-full shadow-lg ${
                    isOnStove || canUseFaucet
                      ? "bg-gradient-to-b from-orange-100 to-orange-300 animate-pulse"
                      : "bg-gradient-to-b from-purple-100 to-purple-300"
                  }`}
                ></div>
              </div>
            </div>
          </div>

          {/* Right Corner Analog Stick - Top Right */}
          <div className="absolute top-4 right-4 z-10">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-b from-indigo-300 to-indigo-500 rounded-full shadow-lg border-2 border-indigo-200"></div>
              <div className="absolute top-0.5 left-0.5 w-7 h-7 bg-gradient-to-b from-indigo-200 to-indigo-400 rounded-full shadow-inner flex items-center justify-center">
                <div
                  className={`w-4 h-4 rounded-full shadow-lg ${
                    isActuallyOnRail || canUseRail
                      ? "bg-gradient-to-b from-blue-100 to-blue-300 animate-pulse"
                      : "bg-gradient-to-b from-indigo-100 to-indigo-300"
                  }`}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Haptic Feedback Effect */}
        {(isRolling || isBuying) && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-blue-200/20 to-transparent rounded-3xl animate-pulse"></div>
          </div>
        )}
      </div>

      {/* CSS Animation Styles */}
      <style jsx>{`
        @keyframes ledPulse {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
