import CreateTBA from "./CreateTBA";
import { FinalSmartAccount } from "~~/app/account/FinalSmartAccount";

export default function DelegationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Compact Gaming Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
        <div className="relative container mx-auto px-4 py-3">
          <div className="text-center">
            <p className="text-lg text-cyan-200 font-medium max-w-2xl mx-auto">
              Smart Account + Metamask Delegation + Token Bound Account
            </p>
            <div className="flex justify-center gap-2 mt-2">
              <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-400/30 rounded-full text-cyan-300 text-xs font-medium">
                ERC-4337
              </div>
              <div className="px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-300 text-xs font-medium">
                EIP-7710
              </div>
              <div className="px-3 py-1 bg-pink-500/20 border border-pink-400/30 rounded-full text-pink-300 text-xs font-medium">
                ERC-6551
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard - Ultra Compact Layout */}
      <div className="container mx-auto px-4 py-3">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 h-[calc(80vh-120px)]">
          {/* Left Panel - Smart Account */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-2xl overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Panel Header */}
              <div className="bg-gradient-to-r from-cyan-600/20 to-purple-600/20 p-2 border-b border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">SA</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Smart Account</h2>
                    <p className="text-cyan-300 text-xs">ERC-4337 || Smart Account</p>
                  </div>
                </div>
              </div>

              {/* Panel Content */}
              <div className="flex-1 p-2 overflow-y-auto">
                <FinalSmartAccount />
              </div>
            </div>
          </div>

          {/* Right Panel - TBA Creation */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-2xl overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Panel Header */}
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-2 border-b border-purple-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">TBA</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Token Bound Account</h2>
                    <p className="text-purple-300 text-xs">ERC-6551 || Token Bound Account</p>
                  </div>
                </div>
              </div>

              {/* Panel Content */}
              <div className="flex-1 p-2 overflow-y-auto">
                <CreateTBA />
              </div>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-3 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-3">
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-xs">i</span>
            </div>
            UniRamble Game Identity Flow
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Smart Account Flow */}
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                Smart Account (ERC-4337)
              </h4>
              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">1.</span>
                  <span>Connect your EOA wallet (MetaMask)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">2.</span>
                  <span>Deploy Smart Account with gasless transactions</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">3.</span>
                  <span>Fund Smart Account from EOA or withdraw to EOA</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">4.</span>
                  <span>Smart Account enables gasless operations</span>
                </div>
              </div>
            </div>

            {/* TBA Flow */}
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                Token Bound Account (TBA)
              </h4>
              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">1.</span>
                  <span>Mint Chef NFT to Smart Account (gasless)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">2.</span>
                  <span>Create TBA for the NFT (gasless)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">3.</span>
                  <span>TBA becomes your UniRamble game identity</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">4.</span>
                  <span>Use TBA for game interactions and rewards</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 p-2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg">
            <div className="space-y-1">
              <p className="text-xs text-cyan-200 text-center">
                <strong>Gasless Transaction:</strong> Deploy (ERC-4337) Smart Account to enable gasless transactions
                (thanks to Metamask Delegation).
              </p>
              <p className="text-xs text-purple-200 text-center">
                <strong>Game Identity:</strong> TBA address (ERC-6551) serves as your unique UniRamble player identity
                NFT-based progression.
              </p>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-2 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-xs font-medium">System Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-cyan-300 text-xs font-medium">ZeroDev Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-purple-300 text-xs font-medium">MetaMask Delegation Connected</span>
              </div>
            </div>
            <div className="text-slate-400 text-xs">UniRamble v2.0 • Powered by Scaffold-ETH</div>
          </div>
        </div>
      </div>
    </div>
  );
}
