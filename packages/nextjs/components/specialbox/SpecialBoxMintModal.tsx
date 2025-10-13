"use client";

import { useSpecialBox } from "~~/hooks/board/useSpecialBox";

interface Props {
  tbaAddress?: string;
}

const SpecialBoxMintModal = ({ tbaAddress }: Props) => {
  const { isMinting, canMint, hasEnoughHamburgers, boxCount, formattedMintCost, mintBox, error, clearError } =
    useSpecialBox({
      tbaAddress,
      onMintSuccess: tokenId => {
        console.log("Special Box minted successfully:", tokenId);
      },
    });

  const handleMint = async () => {
    if (!canMint || isMinting) return;

    clearError();
    await mintBox();
  };

  const buttonText = () => {
    if (isMinting) return "Minting...";
    if (!hasEnoughHamburgers) return "Need 10+ Hamburgers";
    return `Mint Special Box (${formattedMintCost})`;
  };

  return (
    <div className="flex flex-col items-start mt-5">
      <p className="text-left mb-4 text-2xl font-semibold underline">Special Box</p>

      <div className="mb-3 space-y-1">
        <p>Special Box: {boxCount}</p>
        {formattedMintCost !== "0 ETH" && <p className="text-sm text-gray-600">Cost: {formattedMintCost}</p>}
        {!hasEnoughHamburgers && <p className="text-sm text-red-600">Need at least 10 hamburgers</p>}
      </div>

      {error && <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">{error}</div>}

      <button
        className={`py-2 px-16 bg-red-500 text-white rounded shadow-md transition-colors ${
          canMint && !isMinting ? "hover:bg-red-400" : "opacity-50 cursor-not-allowed"
        }`}
        onClick={handleMint}
        disabled={!canMint || isMinting}
      >
        {buttonText()}
      </button>
    </div>
  );
};

export default SpecialBoxMintModal;
