"use client";

import { useEffect, useState } from "react";
import { GameBoard } from "./GameBoard";
import { GameControls } from "./GameControls";
import { GameDashboard } from "./GameDashboard";
import { MobilePanels } from "./MobilePanels";
import { useAccount } from "wagmi";
import HeaderBanner from "~~/components/header/HeaderBanner";
import { useActionBoard } from "~~/hooks/board/useActionBoard";
import { useGameData } from "~~/hooks/board/useGameData";
import { useGameEvents } from "~~/hooks/envio/useGameEvents";
import { usePlayerPositions } from "~~/hooks/envio/usePlayerPositions";
import { useTokenBalances } from "~~/hooks/envio/useTokenBalances";

export const EnvioBoard = () => {
  const { address } = useAccount();
  const [showGameHubPanel, setShowGameHubPanel] = useState(false);

  // Envio-powered hooks u/ performa faster
  const { loading: positionsLoading } = usePlayerPositions();
  const { ingredientPurchases, specialBoxMints, loading: eventsLoading } = useGameEvents(address);
  const { balances: envioBalances, loading: balancesLoading } = useTokenBalances(address);

  // Original hooks with Smart Account TBA integration
  const {
    tbaAddress,
    gridData,
    isOnStove,
    updateStoveStatus,
    envioPlayerPosition: gameDataEnvioPosition,
    smartAccountTbaAddress,
    effectiveAddress,
  } = useGameData(address);

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
    // Envio data from useActionBoard (we only use envio.playerPosition)
    envio,
    usingSmartAccountTBA,
  } = useActionBoard({ tbaAddress });

  // Envio player position (lebih cepat) - prioritize Smart Account TBA
  const finalEnvioPlayerPosition = (envio && envio.playerPosition) || gameDataEnvioPosition || playerPosition;

  // Loading state
  const isLoading = !gridData || gridData.length === 0;
  const envioLoading = positionsLoading || eventsLoading || balancesLoading;

  // Update stove status when player position changes
  useEffect(() => {
    updateStoveStatus(finalEnvioPlayerPosition);
  }, [gridData, finalEnvioPlayerPosition, updateStoveStatus]);

  // Debug logging
  const envioPlayerPositionDebug = envio ? envio.playerPosition : undefined;
  console.log("Envio Board Smart Account render:", {
    address,
    tbaAddress,
    smartAccountTbaAddress,
    effectiveAddress,
    usingSmartAccountTBA,
    finalEnvioPlayerPosition,
    envioPlayerPosition: envioPlayerPositionDebug,
    gameDataEnvioPosition,
    gridData: gridData?.length,
    isModalOpen,
    buyError,
    isLoading,
    envioLoading,
    envioBalances,
    ingredientPurchases: ingredientPurchases.length,
    specialBoxMints: specialBoxMints.length,
  });

  // Simple error logging without blocking UI
  if (buyError) {
    console.warn("Game action error (non-blocking):", buyError);
  }

  // Show loading state only if essential data is not ready
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div>Loading game...</div>
          {envioLoading && <div className="text-sm mt-2 text-green-400">⚡ Envio syncing...</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden">
      {/* Envio Performance Indicator */}
      {!envioLoading && (
        <div className="fixed top-2 right-2 z-50 bg-green-500/90 backdrop-blur-sm border border-green-400 rounded-md px-3 py-1 shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
            <span className="text-green-100 text-xs font-bold">⚡ POWERED BY ENVIO INDEXER</span>
          </div>
        </div>
      )}

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full w-full px-[250px] pt-[40px] ">
        {/* Desktop Header */}
        <div className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-purple-600 to-blue-600">
          <HeaderBanner />
        </div>

        {/* Top Left Panel - Create Token Bound Accounts */}
        <div className="fixed top-[55px] h-[390px] w-[445px] ml-1 pl-5w-80 p-4 flex flex-col h-full">
          <GameDashboard tbaAddress={tbaAddress} />
        </div>

        {/* Center - Game Board */}
        <div className="flex-1 flex flex-col items-center justify-start pt-8">
          {/* Game Board */}
          <div className="fixed top-18 left-1/2 transform -translate-x-1/2">
            {(() => {
              try {
                return <GameBoard gridData={gridData} playerPositionData={finalEnvioPlayerPosition} />;
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
              playerPosition={finalEnvioPlayerPosition}
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
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col h-full">
        {/* Mobile Header */}
        <div className="sticky bg-gradient-to-r from-purple-600 to-blue-600 top-0 z-50">
          <HeaderBanner />
        </div>

        {/* Mobile Game Board */}
        <div className="md:hidden min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200">
          <MobilePanels
            showGameHubPanel={showGameHubPanel}
            setShowGameHubPanel={setShowGameHubPanel}
            tbaAddress={tbaAddress}
            foodTokens={[
              { name: "Bread", amount: envioBalances.bread, icon: "🍞", color: "yellow" },
              { name: "Meat", amount: envioBalances.meat, icon: "🥩", color: "red" },
              { name: "Lettuce", amount: envioBalances.lettuce, icon: "🥬", color: "green" },
              { name: "Tomato", amount: envioBalances.tomato, icon: "🍅", color: "red" },
            ]}
            gridData={gridData}
            playerPosition={finalEnvioPlayerPosition}
            faucetUsed={faucetUsed}
            canBuy={canBuy}
          />
        </div>

        {/* Mobile Game Board */}
        <div className="fixed top-[120px] left-1/2 transform -translate-x-1/2 flex items-center justify-center pt-4 px-4">
          {(() => {
            try {
              return <GameBoard gridData={gridData} playerPositionData={finalEnvioPlayerPosition} isMobile={true} />;
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
              playerPosition={finalEnvioPlayerPosition}
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
    </div>
  );
};

export default EnvioBoard;
