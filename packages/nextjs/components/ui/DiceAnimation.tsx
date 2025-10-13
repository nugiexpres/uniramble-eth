"use client";

import React, { useEffect, useState } from "react";

interface DiceAnimationProps {
  isRolling: boolean;
  finalResult?: number;
  onAnimationComplete?: () => void;
}

const DiceAnimation: React.FC<DiceAnimationProps> = ({ isRolling, finalResult, onAnimationComplete }) => {
  const [currentDice, setCurrentDice] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isRolling && !isAnimating) {
      setIsAnimating(true);
      setCurrentDice(1);

      // Start dice rolling animation
      const rollInterval = setInterval(() => {
        setCurrentDice(prev => (prev % 6) + 1);
      }, 100);

      // Stop animation after 2 seconds or when final result is available
      const stopTimeout = setTimeout(
        () => {
          clearInterval(rollInterval);
          if (finalResult && finalResult > 0) {
            setCurrentDice(finalResult);
          }
          setIsAnimating(false);
          onAnimationComplete?.();
        },
        finalResult ? 1000 : 2000,
      );

      return () => {
        clearInterval(rollInterval);
        clearTimeout(stopTimeout);
      };
    }
  }, [isRolling, finalResult, isAnimating, onAnimationComplete]);

  if (!isRolling && !isAnimating) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center max-w-[300px]">
        <div className="text-6xl mb-4 animate-bounce">{getDiceFace(currentDice)}</div>
        <p className="text-gray-700 text-center text-lg font-medium">
          {isAnimating ? "Rolling dice..." : `Rolled: ${currentDice}`}
        </p>
      </div>
    </div>
  );
};

const getDiceFace = (number: number): string => {
  const diceFaces: { [key: number]: string } = {
    1: "⚀",
    2: "⚁",
    3: "⚂",
    4: "⚃",
    5: "⚄",
    6: "⚅",
  };
  return diceFaces[number] || "⚀";
};

export default DiceAnimation;
