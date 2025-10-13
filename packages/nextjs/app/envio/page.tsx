"use client";

import { motion } from "framer-motion";
import { Activity, AlertCircle, CheckCircle, Database, ExternalLink, Loader2, RefreshCw, Users } from "lucide-react";
import { useAccount } from "wagmi";
import { useAllPlayers, useCompletePlayerData, useEnvioClient, useGameState } from "~~/hooks/envio";

export default function EnvioPage() {
  const { address } = useAccount();
  const { client, config, isEnabled, chainId, chainName } = useEnvioClient();

  // Envio queries
  const { data: gameStateData, isLoading: gameStateLoading, refetch: refetchGameState } = useGameState();
  const { data: playersData, isLoading: playersLoading, refetch: refetchPlayers } = useAllPlayers(10);
  const {
    playerState,
    tokenBalances,
    playerActions,
    isLoading: playerDataLoading,
    refetch: refetchPlayerData,
  } = useCompletePlayerData(address);

  // Extract data
  const gameState = gameStateData?.GameState?.[0];
  const players = playersData?.PlayerState || [];
  const currentPlayer = playerState?.PlayerState?.[0];

  // Refresh all data
  const handleRefresh = () => {
    refetchGameState();
    refetchPlayers();
    if (address) refetchPlayerData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-4"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Envio Indexer</h1>
              <p className="text-slate-400">Real-time blockchain data indexing and GraphQL API</p>
            </div>
          </motion.div>

          {/* Network & Connection Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${isEnabled && client ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
                />
                <div>
                  <p className="text-white font-medium">
                    {chainName} (Chain ID: {chainId})
                  </p>
                  <p className="text-sm text-slate-400">
                    {isEnabled ? (client ? "Connected to Envio" : "Connecting...") : "Envio not enabled"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  title="Refresh data"
                >
                  <RefreshCw className="w-4 h-4 text-white" />
                </button>
                <a
                  href={config.graphqlUrl.replace("/v1/graphql", "")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Hasura
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Show message if Envio is not enabled */}
        {!isEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-6 mb-8"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Envio Not Enabled</h3>
                <p className="text-slate-300 mb-4">Envio indexer is not enabled for chain {chainId}. To enable it:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
                  <li>
                    Edit{" "}
                    <code className="bg-slate-800 px-2 py-1 rounded">
                      packages/nextjs/utils/envio/extendedNetworks.ts
                    </code>
                  </li>
                  <li>Set enabled: true for chain {chainId} in ENVIO_NETWORKS</li>
                  <li>
                    Start the indexer:{" "}
                    <code className="bg-slate-800 px-2 py-1 rounded">cd packages/envio && yarn dev</code>
                  </li>
                </ol>
              </div>
            </div>
          </motion.div>
        )}

        {/* Status Card */}
        {isEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Game State */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Game State</h3>
                {gameStateLoading ? (
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                ) : gameState ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-yellow-400" />
                )}
              </div>
              {gameStateLoading ? (
                <div className="text-slate-400">Loading game state...</div>
              ) : gameState ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-slate-400">Total Players:</span>
                    <span className="ml-2 text-xl font-bold text-white">{gameState.totalPlayers || 0}</span>
                  </div>
                  <div>
                    <span className="text-sm text-slate-400">Total Moves:</span>
                    <span className="ml-2 text-xl font-bold text-white">{gameState.totalMoves || 0}</span>
                  </div>
                  <div>
                    <span className="text-sm text-slate-400">Ingredients Bought:</span>
                    <span className="ml-2 text-xl font-bold text-white">{gameState.totalIngredientsBought || 0}</span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400">No game state data available</div>
              )}
            </motion.div>

            {/* Your Player Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Your Stats</h3>
                {playerDataLoading ? (
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                ) : currentPlayer ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-slate-500" />
                )}
              </div>
              {!address ? (
                <div className="text-slate-400 text-sm">Connect wallet to view your stats</div>
              ) : playerDataLoading ? (
                <div className="text-slate-400">Loading player data...</div>
              ) : currentPlayer ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-slate-400">Position:</span>
                    <span className="ml-2 text-lg font-bold text-white">{currentPlayer.position}</span>
                  </div>
                  <div>
                    <span className="text-sm text-slate-400">Balance:</span>
                    <span className="ml-2 text-lg font-bold text-white">
                      {(Number(currentPlayer.balance) / 1e18).toFixed(4)} ETH
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-slate-400">NFT Balance:</span>
                    <span className="ml-2 text-lg font-bold text-white">{currentPlayer.nftBalance}</span>
                  </div>
                  {tokenBalances?.TokenBalances && tokenBalances.TokenBalances.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <div className="text-xs text-slate-400 mb-2">Token Balances:</div>
                      {tokenBalances.TokenBalances.slice(0, 3).map((tb: any) => (
                        <div key={tb.id} className="text-xs text-slate-300 flex justify-between">
                          <span className="truncate">{tb.token.slice(0, 8)}...</span>
                          <span>{(Number(tb.balance) / 1e18).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-400">No player data found</div>
              )}
            </motion.div>

            {/* Active Players */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Top Players</h3>
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              {playersLoading ? (
                <div className="text-slate-400">Loading players...</div>
              ) : players.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {players.slice(0, 5).map((player: any, index: number) => (
                    <div key={player.id} className="flex items-center justify-between bg-slate-700/30 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {index + 1}
                        </div>
                        <div className="text-xs">
                          <div className="text-white font-medium">{player.id.slice(0, 8)}...</div>
                          <div className="text-slate-400">Pos: {player.position}</div>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="text-white font-medium">{(Number(player.balance) / 1e18).toFixed(4)}</div>
                        <div className="text-slate-400">ETH</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400">No players found</div>
              )}
            </motion.div>
          </div>
        )}

        {/* Recent Actions */}
        {isEnabled && address && playerActions?.PlayerAction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Your Recent Actions</h3>
              <Activity className="w-6 h-6 text-purple-400" />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {playerActions.PlayerAction.slice(0, 10).map((action: any) => (
                <div key={action.id} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{action.actionType}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${action.success ? "bg-green-600" : "bg-red-600"} text-white`}
                    >
                      {action.success ? "Success" : "Failed"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <div>Time: {new Date(Number(action.timestamp) * 1000).toLocaleString()}</div>
                    {action.data && (
                      <div className="break-all">
                        Data: {typeof action.data === "string" ? action.data : JSON.stringify(action.data)}
                      </div>
                    )}
                    <div className="truncate">Tx: {action.txHash}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Setup Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-8"
        >
          <h3 className="text-xl font-semibold text-white mb-3">Quick Setup Guide</h3>
          <p className="text-slate-400 text-sm mb-4">
            Ensure Envio indexer is running to see real-time data from your contracts.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-cyan-300 mb-2">1. Install & Generate</h4>
              <div className="bg-slate-900/50 rounded-lg p-3 text-sm text-slate-300 space-y-1 font-mono">
                <div>$ cd packages/envio</div>
                <div>$ source ~/.nvm/nvm.sh && nvm use 20</div>
                <div>$ yarn install</div>
                <div>$ yarn envio:update</div>
                <div>$ yarn codegen</div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-cyan-300 mb-2">2. Start Indexer</h4>
              <div className="bg-slate-900/50 rounded-lg p-3 text-sm text-slate-300 space-y-1 font-mono">
                <div>$ cd packages/envio</div>
                <div>$ TUI_OFF=true yarn dev</div>
                <div className="text-green-400 mt-2">✓ Indexer running on localhost:8080</div>
                <div className="text-slate-500">
                  GraphQL:{" "}
                  <a className="underline hover:text-white" href="http://localhost:8080" target="_blank">
                    http://localhost:8080
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
            <div className="text-sm text-blue-300 font-medium mb-2">💡 Tip: Auto-update on Contract Changes</div>
            <div className="text-xs text-slate-300">
              Run <code className="bg-slate-800 px-2 py-1 rounded">yarn envio:watch</code> in{" "}
              <code>packages/envio</code> to automatically update config when contracts change!
            </div>
          </div>
        </motion.div>

        {/* GraphQL Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Example GraphQL Queries</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-cyan-400 mb-3">Get Player State</h4>
              <pre className="bg-slate-900/50 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto">
                {`query GetPlayerState($address: String!) {
  PlayerState(where: { id: { _eq: $address } }) {
    id
    position
    balance
    nftBalance
    lastUpdated
    tbaAddress
  }
}`}
              </pre>
            </div>

            <div>
              <h4 className="text-lg font-medium text-cyan-400 mb-3">Get Player Actions</h4>
              <pre className="bg-slate-900/50 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto">
                {`query GetPlayerActions($player: String!) {
  PlayerAction(
    where: { player: { _eq: $player } }
    order_by: { timestamp: desc }
    limit: 50
  ) {
    id
    player
    actionType
    timestamp
    data
    success
    txHash
  }
}`}
              </pre>
            </div>
          </div>

          <div className="mt-6 p-4 bg-purple-900/20 border border-purple-700/30 rounded-lg">
            <div className="text-sm text-purple-300 font-medium mb-2">📚 Learn More</div>
            <div className="text-xs text-slate-300 space-y-1">
              <div>
                • Check <code className="bg-slate-800 px-2 py-1 rounded">packages/envio/README_INTEGRATION.md</code> for
                complete documentation
              </div>
              <div>
                • All queries are in{" "}
                <code className="bg-slate-800 px-2 py-1 rounded">packages/nextjs/hooks/envio/queries/</code>
              </div>
              <div>
                • Use hooks like <code className="bg-slate-800 px-2 py-1 rounded">usePlayerState()</code>,{" "}
                <code className="bg-slate-800 px-2 py-1 rounded">useGameState()</code> in your components
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
