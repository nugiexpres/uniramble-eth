import { useContext } from "react";
import { BoardStateContext } from "./BoardStateProvider";
import { AnimatePresence, motion } from "framer-motion";
import { useAccount } from "wagmi";

export const Board = () => {
  const { address } = useAccount();
  const { gameState, loading, error } = useContext(BoardStateContext);

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-[600px] bg-base-200 rounded-xl">
        <div className="text-error">
          <h3 className="text-lg font-bold">Error loading game state</h3>
          <p className="text-sm opacity-70">{error.message}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-[600px] bg-base-200 rounded-xl">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] bg-base-200 rounded-xl">
      {/* Board grid */}
      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-1 p-4">
        {Array.from({ length: 64 }).map((_, i) => (
          <div key={i} className="relative bg-base-300 rounded-lg">
            {/* Show position number */}
            <span className="absolute top-1 left-1 text-xs opacity-50">{i + 1}</span>

            {/* Show players on this position */}
            <AnimatePresence>
              {gameState.players
                .filter(p => p.position === i)
                .map(player => (
                  <motion.div
                    key={player.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className={`absolute inset-2 rounded-full 
                      ${player.id === address ? "bg-primary" : "bg-secondary"}
                      ${player.tbaAddress ? "ring-2 ring-accent" : ""}`}
                  />
                ))}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Player stats */}
      <div className="absolute top-4 right-4 w-64 bg-base-100 rounded-xl p-4 space-y-2">
        {gameState.players
          .filter(p => p.id === address)
          .map(player => (
            <div key={player.id}>
              <div className="text-sm opacity-70">Your Position</div>
              <div className="text-2xl font-bold">{player.position + 1}</div>

              <div className="mt-4 text-sm opacity-70">Balance</div>
              <div className="text-xl">{player.balance.toString()} MON</div>

              <div className="mt-4 text-sm opacity-70">NFTs Owned</div>
              <div className="text-xl">{player.nftBalance}</div>

              {player.tbaAddress && (
                <>
                  <div className="mt-4 text-sm opacity-70">TBA</div>
                  <div className="text-sm font-mono truncate">{player.tbaAddress}</div>
                </>
              )}
            </div>
          ))}
      </div>

      {/* Recent actions */}
      <div className="absolute bottom-4 left-4 right-72 bg-base-100 rounded-xl p-4">
        <div className="text-sm font-semibold mb-2">Recent Actions</div>
        <div className="space-y-1">
          {gameState.actions.slice(0, 5).map(action => (
            <div key={action.id} className="flex items-center gap-2 text-sm">
              <span className="opacity-50">{new Date(parseInt(action.timestamp)).toLocaleTimeString()}</span>
              <span className="font-mono">{action.player.slice(0, 6)}</span>
              <span className="capitalize">{action.actionType}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
