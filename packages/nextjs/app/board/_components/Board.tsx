import { useEffect, useState } from "react";
// import CreateTBA from "./CreateTBA";
import { GameBoard } from "./GameBoard";
import { GameControls } from "./GameControls";
import { GameDashboard } from "./GameDashboard";
// import { GameHubPanel } from "./GameHubPanel";
// import { GaslessGameControls } from "~~/components/board/GaslessGameControls";
import { MobilePanels } from "./MobilePanels";
// import { SpecialBoxModals } from "./SpecialBoxModals";
import { useAccount } from "wagmi";
import HeaderBanner from "~~/components/header/HeaderBanner";
// import DiceAnimation from "~~/components/ui/DiceAnimation";
//import LoadingModal from "~~/components/ui/LoadingModal";
import { useActionBoard } from "~~/hooks/board/useActionBoard";
import { useFoodTokens } from "~~/hooks/board/useFoodTokens";
import { useGameData } from "~~/hooks/board/useGameData";

// import { useGaslessActionBoard } from "~~/hooks/board/useGaslessActionBoard";

// import { useSpecialBox } from "~~/hooks/board/useSpecialBox";

export const Board = () => {
  const { address } = useAccount();
  const [showGameHubPanel, setShowGameHubPanel] = useState(false);
  // const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 2. Buat callback function untuk handle mint success
  // const handleMintSuccess = useCallback(() => {
  //   console.log("Special Box mint successful! Refreshing data...");

  // Refresh semua data yang relevan
  //  setRefreshTrigger(prev => prev + 1);

  // Jika ada refetch functions untuk food NFTs, panggil disini
  // refetchFoodNfts?.();
  // refetchPlayerData?.();

  // Optional: Show success notification
  // toast.success("Special Box minted successfully!");
  // }, []);

  // Mobile states
  // const [showTBAPanel, setShowTBAPanel] = useState(false);
  // const [showCollectionPanel, setShowCollectionPanel] = useState(false);

  // Custom hooks
  const { tbaAddress, gridData, isOnStove, updateStoveStatus } = useGameData(address);
  const { foodTokens } = useFoodTokens(tbaAddress);
  const {
    isModalOpen,
    faucetUsed,
    canBuy,
    isRolling,
    isBuying,
    isRailTraveling,
    isCooking,
    isUsingFaucet,
    buyError,
    ingredientFee,
    handleRoll,
    handleBuy,
    handleRail,
    handleCook,
    handleFaucetMon,
    playerPosition,
    effectivePosition,
    isSmartAccountDeployed,
    smartAccountAddress,
    userTBA,
  } = useActionBoard({ tbaAddress });

  // Loading state
  const isLoading = !gridData || gridData.length === 0;

  // Update stove status when player position changes
  useEffect(() => {
    updateStoveStatus(playerPosition);
  }, [gridData, playerPosition, updateStoveStatus]);

  // Error boundary for debugging
  if (buyError) {
    console.error("Board error:", buyError);
  }

  // Debug logging
  console.log("Board render:", {
    tbaAddress,
    playerPosition,
    gridData: gridData?.length,
    isModalOpen,
    buyError,
    isLoading,
  });

  // Don't show full-screen error for contract errors - let scaffold-eth handle them
  // Only show critical errors that are not contract-related
  if (
    buyError &&
    buyError.includes("critical") &&
    !buyError.includes("revert") &&
    !buyError.includes("execution reverted")
  ) {
    console.error("Critical Board error:", buyError);
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center">
        <div className="text-white text-xl text-center max-w-md">
          <div className="text-2xl font-bold mb-4">⚠️ Critical Error</div>
          <div className="mb-4">{buyError}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-white text-red-900 rounded-lg hover:bg-gray-100 font-bold"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Show loading state if data is not ready
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading game data...</div>
      </div>
    );
  }

  // Show error state if there's a critical error
  if (buyError && buyError.includes("critical")) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center">
        <div className="text-white text-xl text-center">
          <div>Error: {buyError}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-white text-red-900 rounded-lg hover:bg-gray-100"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden">
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full w-full px-[250px] pt-[40px] ">
        {/* Desktop Header */}
        <div className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-purple-600 to-blue-600">
          <HeaderBanner />
        </div>

        {/* Top Left Panel - Create Token Bound Account */}
        <div className="fixed top-[55px] h-[390px] w-[445px] ml-1 pl-5w-80 p-4 flex flex-col h-full">
          <GameDashboard
            tbaAddress={tbaAddress}
            foodTokens={foodTokens}
            gridData={gridData}
            playerPosition={playerPosition}
            faucetUsed={faucetUsed}
            canBuy={canBuy}
          />
        </div>

        {/* Center - Game Board */}
        <div className="flex-1 flex flex-col items-center justify-start pt-8">
          {/* Game Board */}
          <div className="fixed top-18 left-1/2 transform -translate-x-1/2">
            {(() => {
              try {
                return <GameBoard gridData={gridData} playerPositionData={playerPosition} />;
              } catch (error) {
                console.error("GameBoard render error:", error);
                return (
                  <div className="relative bg-gradient-to-br from-red-300 to-red-400 rounded-xl shadow-xl border-4 border-red-500 mb-6 flex items-center justify-center w-[445px] h-[445px]">
                    <div className="text-red-800 text-center">
                      <div className="text-lg font-bold">Game Board Error</div>
                      <div className="text-sm">Please refresh the page</div>
                    </div>
                  </div>
                );
              }
            })()}
          </div>

          {/* Game Controls */}
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2">
            <GameControls
              handleRoll={handleRoll}
              handleBuy={handleBuy}
              handleRail={handleRail}
              handleCook={handleCook}
              handleFaucetMon={handleFaucetMon}
              isOnStove={isOnStove}
              faucetUsed={faucetUsed}
              canBuy={canBuy}
              isModalOpen={isModalOpen}
              playerPosition={playerPosition}
              isRolling={isRolling}
              isBuying={isBuying}
              isRailTraveling={isRailTraveling}
              isCooking={isCooking}
              isUsingFaucet={isUsingFaucet}
              buyError={buyError}
              ingredientFee={ingredientFee}
              effectivePosition={effectivePosition}
              tbaAddress={tbaAddress}
              gridData={gridData}
              isSmartAccountDeployed={isSmartAccountDeployed}
              smartAccountAddress={smartAccountAddress || undefined}
              smartAccountTbaAddress={userTBA}
            />
          </div>
        </div>

        {/* Right Panel - TODO Leaderboard */}
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col h-full">
        {/* Mobile Header */}
        <div className="sticky bg-gradient-to-r from-purple-600 to-blue-600 top-0 z-50">
          <HeaderBanner />
        </div>

        {/* Mobile Game Board: TODO setup ulang* */}
        <div className="md:hidden min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200">
          {/* Mobile Panels */}
          <MobilePanels
            showGameHubPanel={showGameHubPanel}
            setShowGameHubPanel={setShowGameHubPanel}
            tbaAddress={tbaAddress}
            foodTokens={foodTokens}
            gridData={gridData}
            playerPosition={playerPosition}
            faucetUsed={faucetUsed}
            canBuy={canBuy}
          />
        </div>

        {/* Mobile Game Board */}
        <div className="fixed top-[120px] left-1/2 transform -translate-x-1/2 flex items-center justify-center pt-4 px-4">
          {(() => {
            try {
              return <GameBoard gridData={gridData} playerPositionData={playerPosition} isMobile={true} />;
            } catch (error) {
              console.error("Mobile GameBoard render error:", error);
              return (
                <div className="relative bg-gradient-to-br from-red-300 to-red-400 rounded-xl shadow-xl border-4 border-red-500 mb-6 flex items-center justify-center w-[425px] h-[425px]">
                  <div className="text-red-800 text-center">
                    <div className="text-lg font-bold">Mobile Game Board Error</div>
                    <div className="text-sm">Please refresh the page</div>
                  </div>
                </div>
              );
            }
          })()}

          {/* Mobile Game Controls */}
          <div className="md:hidden fixed top-[400px] left-1/2 transform -translate-x-1/2 z-10 flex items-center justify-center">
            <GameControls
              handleRoll={handleRoll}
              handleBuy={handleBuy}
              handleRail={handleRail}
              handleCook={handleCook}
              handleFaucetMon={handleFaucetMon}
              isOnStove={isOnStove}
              faucetUsed={faucetUsed}
              canBuy={canBuy}
              isModalOpen={isModalOpen}
              playerPosition={playerPosition}
              isRolling={isRolling}
              isBuying={isBuying}
              isRailTraveling={isRailTraveling}
              isCooking={isCooking}
              isUsingFaucet={isUsingFaucet}
              buyError={buyError}
              ingredientFee={ingredientFee}
              effectivePosition={effectivePosition}
              tbaAddress={tbaAddress}
              gridData={gridData}
              isMobile={true}
              isSmartAccountDeployed={isSmartAccountDeployed}
              smartAccountAddress={smartAccountAddress || undefined}
            />
          </div>
        </div>
      </div>

      {/* Loading Modal - DISABLED FOR DEBUGGING */}
      {/* <LoadingModal open={isModalOpen && !isRolling} message={modalMessage} /> */}

      {/* Dice Animation - DISABLED FOR DEBUGGING */}
      {/* <DiceAnimation
        isRolling={isRolling}
        finalResult={randomRollResult}
        onAnimationComplete={() => {
          console.log("Dice animation completed");
        }}
      /> */}

      {/* Special Box Modals
      <SpecialBoxModals
        showModal={showModal}
        showSuccessModal={showSuccessModal}
        setShowModal={setShowModal}
        setShowSuccessModal={setShowSuccessModal}
        hamburgerCount={safeFoodNfts.length}
        specialBoxCount={specialBoxCount}
      />
      */}
    </div>
  );
};

export default Board;
