"use client";

import { useState } from "react";
import Image from "next/image";
import SpecialBoxMintModal from "./SpecialBoxMintModal";
import { AnimatePresence, motion } from "framer-motion";
import { useAccount } from "wagmi";
import { useSpecialBox } from "~~/hooks/board/useSpecialBox";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface Props {
  isMobile: boolean;
  tbaAddress?: string;
}

const CombineFood = ({ isMobile, tbaAddress }: Props) => {
  const { address } = useAccount();
  const [showCombine, setShowCombine] = useState(!isMobile);

  useSpecialBox({ tbaAddress });

  // Get food NFTs from TBA address if provided, otherwise from user address
  const effectiveAddress = tbaAddress || address;

  const { data: foodNftsData } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "getMyFoods",
    args: [effectiveAddress],
    query: {
      enabled: !!effectiveAddress,
    },
  });

  const safeFoodNfts = Array.isArray(foodNftsData) ? foodNftsData : [];

  return (
    <div className="relative z-30 mt-5 px-4">
      {isMobile && (
        <button
          onClick={() => setShowCombine(prev => !prev)}
          className={`text-white px-4 py-2 rounded-md shadow mb-2 absolute z-110 whitespace-nowrap ${
            showCombine ? "bg-red-600" : "bg-purple-600"
          }`}
          style={{ top: -20, right: 0 }}
        >
          {showCombine ? "Hide Combine Food" : "Combine Food"}
        </button>
      )}

      <AnimatePresence>
        {(showCombine || !isMobile) && (
          <motion.div
            key="combine-food-box"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-purple-300 p-5 rounded-lg shadow-lg w-full max-w-[275px] h-[445px]"
            style={{
              position: isMobile ? "absolute" : "static",
              top: isMobile ? 40 : undefined,
              right: isMobile ? 0 : undefined,
              zIndex: 100,
            }}
          >
            <h2 className="text-left mb-4 text-2xl font-semibold underline">Hamburger</h2>

            <div className="flex flex-col items-center">
              {safeFoodNfts.length > 0 ? (
                <>
                  <div className="relative w-20 h-20 border bg-white rounded-lg shadow-lg flex items-center justify-center">
                    <Image src="/assets/hamburger.png" width={70} height={70} alt="Hamburger" />
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-md">
                      x{safeFoodNfts.length}
                    </span>
                  </div>
                  <p className="mt-2 text-center">Hamburger</p>
                </>
              ) : (
                <p>No Hamburger found</p>
              )}
            </div>

            <SpecialBoxMintModal tbaAddress={tbaAddress} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CombineFood;
