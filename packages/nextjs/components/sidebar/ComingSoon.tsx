import React from "react";

export const ComingSoon: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-100 via-white to-yellow-100 px-4 py-12">
      <div className="text-center max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-purple-800 mb-6">Marketplace Coming Soon</h1>

        <p className="text-lg text-gray-700 mb-4 font-semibold">
          SpecialBox Marketplace: Unlock the Fun, Claim the Rewards
        </p>

        <div className="text-left text-gray-700 text-base space-y-5">
          <p>
            Welcome to the SpecialBox Marketplace — your ultimate destination for turning those shiny SpecialBoxes into
            exclusive in-game rewards!
          </p>

          <h2 className="font-bold text-purple-800">What’s a SpecialBox?</h2>
          <p>
            SpecialBoxes are more than just collectibles — they are your key to future treasure. Each box gives access
            to powerful items, limited-edition cosmetics, rare tokens, and secret perks. The more you collect, the
            better the rewards. Think of it as your VIP pass to the coolest parts of the game.
          </p>

          <h2 className="font-bold text-purple-800">Why Should You Collect SpecialBoxes?</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Unlock rare rewards: Trade boxes for legendary gear and secret items.</li>
            <li>Access future events: Required for exclusive events and seasonal competitions.</li>
            <li>Limited-time offers: Marketplace rewards rotate often — grab them fast.</li>
            <li>Proof of dedication: Show your journey, progress, and mastery.</li>
          </ul>
          <h2 className="font-bold text-purple-800">How to Use the Marketplace</h2>
          <p>
            Keep playing, complete quests, conquer challenges, and always be on the lookout. Surprise drops can happen
            anytime!
          </p>

          <h2 className="font-bold text-purple-800">Pro Tip</h2>
          <p>
            Do not burn all your SpecialBoxes at once. Some of the most valuable rewards are planned for future seasons.
            Strategize, save, and spend wisely.
          </p>

          <h2 className="font-bold text-purple-800">Ready to Redeem?</h2>
          <p>Let the trading begin. Soon, you will be able to connect your wallet and redeem your boxes. Stay tuned!</p>
        </div>

        <div className="mt-10">
          <p className="text-sm text-gray-500">
            Stay updated by following{" "}
            <a
              href="https://twitter.com/nugrosir"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 font-semibold hover:underline"
            >
              @nugrosir
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
