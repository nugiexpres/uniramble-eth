"use client";

import { useAccount } from "wagmi";
import { WalletConnectionWarning } from "~~/components/scaffold-eth";
import { useSpecialBox } from "~~/hooks/board/useSpecialBox";

interface Props {
  compact?: boolean;
  tbaAddress?: string;
}

const SpecialBoxData = ({ compact = false, tbaAddress }: Props) => {
  const { isConnected } = useAccount();
  const {
    boxBalance,
    boxCount,
    hasEnoughHamburgers,
    canMintCount,
    totalSupply,
    formattedBoxPrice,
    formattedMintCost,
    userTBA,
  } = useSpecialBox({ tbaAddress });

  if (!isConnected) {
    return <WalletConnectionWarning className="text-gray-500" />;
  }

  const CompactView = () => (
    <div className="bg-gray-100 p-4 rounded-lg space-y-2">
      <h3 className="font-semibold text-lg">Special Box Summary</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">Your Boxes:</span> {boxCount}
        </div>
        <div>
          <span className="font-medium">Total Supply:</span> {totalSupply?.toString() || "0"}
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-medium">Can Mint:</span>
          <span className={hasEnoughHamburgers ? "text-green-600" : "text-red-600"}>
            {hasEnoughHamburgers ? "Yes" : "No"}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-medium">Mintable:</span>
          <span className="text-blue-600">{canMintCount?.toString() || "0"} boxes</span>
        </div>
      </div>
      {formattedMintCost !== "0 ETH" && (
        <div className="text-sm">
          <span className="font-medium">Mint Cost:</span> {formattedMintCost}
        </div>
      )}
    </div>
  );

  const DetailedView = () => (
    <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Special Box Dashboard</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800">Your Boxes</h4>
          <p className="text-2xl font-bold text-blue-600">{boxCount}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800">Total Supply</h4>
          <p className="text-2xl font-bold text-green-600">{totalSupply?.toString() || "0"}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-semibold text-purple-800">Can Mint</h4>
          <p className="text-2xl font-bold text-purple-600">{canMintCount?.toString() || "0"}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <h4 className="font-semibold text-orange-800">Mint Cost</h4>
          <p className="text-2xl font-bold text-orange-600">{formattedMintCost}</p>
        </div>
      </div>

      {/* Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Mint Status</h4>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${hasEnoughHamburgers ? "bg-green-500" : "bg-red-500"}`} />
            <span>{hasEnoughHamburgers ? "Ready to mint" : "Need 10+ hamburgers"}</span>
          </div>
          {!hasEnoughHamburgers && (
            <p className="text-sm text-gray-600 mt-1">Collect more hamburgers to mint Special Box</p>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">TBA Address</h4>
          <p className="text-sm text-gray-600 break-all">{userTBA || "Not connected"}</p>
        </div>
      </div>

      {/* Token IDs */}
      {boxBalance && boxBalance.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Your Box Token IDs</h4>
          <div className="flex flex-wrap gap-2">
            {boxBalance.map((tokenId: bigint, index: number) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                #{tokenId.toString()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">Pricing Information</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Box Price:</span>
            <span className="font-medium">{formattedBoxPrice}</span>
          </div>
          <div className="flex justify-between">
            <span>Mint Cost:</span>
            <span className="font-medium">{formattedMintCost}</span>
          </div>
          <div className="flex justify-between">
            <span>Required Hamburgers:</span>
            <span className="font-medium">10</span>
          </div>
        </div>
      </div>
    </div>
  );

  return compact ? <CompactView /> : <DetailedView />;
};

export default SpecialBoxData;
