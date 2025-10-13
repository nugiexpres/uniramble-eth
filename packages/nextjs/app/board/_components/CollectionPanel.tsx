import Image from "next/image";
import { SpecialBox } from "./SpecialBox";
import { Gift, Sparkles } from "lucide-react";
import { isFreePrice as checkIsFreePrice, formatEthPrice } from "~~/utils/priceUtils";

interface CollectionPanelProps {
  safeFoodNfts: any[];
  specialBoxCount: number;
  canMintSpecialBox: boolean | undefined | string;
  handleMintClick: () => void;
  lastMintedData?: number;
  mintEvents?: any[];
  hamburgerNfts?: any[];
  mintPrice?: bigint;
  mintPriceFormatted?: string;
  isFreeMintPrice?: boolean;
  isMinting?: boolean;
  canMintReason?: string;
  className?: string;
}

export const CollectionPanel = ({
  safeFoodNfts,
  specialBoxCount,
  canMintSpecialBox,
  handleMintClick,
  lastMintedData = 0,
  hamburgerNfts = [],
  mintPrice,
  isMinting = false,
  canMintReason = "",
  className = "",
}: CollectionPanelProps) => {
  const canMint = Boolean(canMintSpecialBox);
  const currentHamburgers = safeFoodNfts.length;
  const requiredHamburgers = 10;
  const hamburgersNeeded = Math.max(requiredHamburgers - currentHamburgers, 0);

  // Calculate next milestone
  const nextMilestone = currentHamburgers < 10 ? 10 : Math.ceil(currentHamburgers / 10) * 10;
  const hamburgersToNextBox = nextMilestone - currentHamburgers;

  // Check if user can mint based on FoodScramble contract logic
  const currentRangeStart = Math.floor(currentHamburgers / 10) * 10;
  const canMintBasedOnRange = lastMintedData < currentRangeStart && currentHamburgers >= 10;

  // Get hamburger count from contract (more reliable)
  const contractHamburgerCount = Array.isArray(hamburgerNfts) ? hamburgerNfts.length : 0;

  // Determine final mint ability
  const finalCanMint = canMint && canMintBasedOnRange && currentHamburgers >= 10 && !isMinting;

  // Get button text based on state
  const getButtonText = () => {
    if (isMinting) return "Minting...";
    if (!canMint) {
      if (canMintReason && canMintReason !== "Can mint") {
        return canMintReason.length > 20 ? "Cannot Mint" : canMintReason;
      }
      return "Collect Burgers";
    }
    if (currentHamburgers < 10) return `Need ${hamburgersNeeded} burgers`;
    if (!canMintBasedOnRange) return "Already claimed";

    // Show price in button if not free
    const priceText = mintPrice && !checkIsFreePrice(mintPrice) ? ` (${formatEthPrice(mintPrice)})` : "";
    return `Mint Special Box${priceText}`;
  };

  return (
    <div
      className={`bg-gradient-to-br from-orange-100 to-yellow-100 p-6 rounded-xl shadow-lg border border-orange-200 ${className}`}
    >
      <h2 className="text-base font-bold text-orange-900 mb-4 flex items-center gap-2">
        <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
        Hamburger Collection
      </h2>

      <div className="flex flex-col items-center mb-1">
        {currentHamburgers > 0 ? (
          <>
            <div className="relative w-20 h-20 border-2 border-orange-300 bg-white rounded-xl shadow-lg flex items-center justify-center">
              <Image src="/assets/hamburger.png" width={70} height={70} alt="Hamburger" />
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full shadow-md font-bold">
                x{currentHamburgers}
              </span>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500">
            <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center mb-2">
              <span className="text-2xl">🍔</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white/70 p-4 rounded-lg border border-orange-200">
        {/* Special Box Header */}
        <div className="flex flex-col items-center mb-3">
          <h2 className="text-lg font-bold text-orange-900 mb-2 flex items-center gap-2">
            <Gift className="w-5 h-5 text-orange-600" />
            Special Box
          </h2>

          {/* Special Box Count Display */}
          <div className="flex items-center justify-center mb-3">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg flex items-center justify-center border-2 border-yellow-300">
                <Image src="/assets/special-box.png" width={70} height={70} alt="Special Box" />
              </div>
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full shadow-md font-bold">
                {specialBoxCount}
              </span>
            </div>
          </div>
        </div>

        {/* Price Display Section
        {mintPrice !== undefined && (
          <div className="flex items-center justify-center mb-3">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                checkIsFreePrice(mintPrice)
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-blue-100 text-blue-700 border border-blue-200"
              }`}
            >
              <span>{mintPriceFormatted || formatEthPrice(mintPrice)}</span>
            </div>
          </div>
        )}
        */}

        {/* Progress Section */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Current: {currentHamburgers}</span>
            <span>Next Box: {nextMilestone}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-gradient-to-r from-orange-400 to-yellow-500 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(((currentHamburgers % 10) / 10) * 100, 100)}%`,
              }}
            ></div>
          </div>
          <p className="text-xs text-center text-gray-600">
            {hamburgersToNextBox > 0 && currentHamburgers >= 10
              ? `${hamburgersToNextBox} more for next box`
              : currentHamburgers < 10
                ? `${hamburgersNeeded} more for first box`
                : "Ready for next box!"}
          </p>
        </div>

        {/* Error/Info Message */}
        {!canMint && canMintReason && canMintReason !== "Can mint" && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600 text-center">{canMintReason}</p>
          </div>
        )}

        {/* Mint Button */}
        <button
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            finalCanMint
              ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          onClick={() => {
            console.log("Mint button clicked:", {
              canMint,
              canMintBasedOnRange,
              currentHamburgers,
              contractHamburgerCount,
              lastMintedData,
              currentRangeStart,
              specialBoxCount,
              mintPrice,
              isMinting,
            });

            if (finalCanMint) {
              handleMintClick();
            }
          }}
          disabled={!finalCanMint}
        >
          {isMinting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Minting...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {getButtonText()}
            </>
          )}
        </button>

        {/* Additional Information */}
        <div className="mt-4">
          <SpecialBox />
        </div>
      </div>
    </div>
  );
};
