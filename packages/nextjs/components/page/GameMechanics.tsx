import Image from "next/image";
import Link from "next/link";

const GameMechanics = () => {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-semibold">LIVE GAMEPLAY</span>
            </div>

            <h2 className="text-5xl lg:text-6xl font-black mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Strategy Meets DeFi
            </h2>

            <div className="space-y-8">
              <div className="flex items-start space-x-4 group">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                  1
                </div>
                <div>
                  <h4 className="text-2xl font-bold mb-3 text-white">Mint & Deploy Your Chog</h4>
                  <p className="text-gray-300 leading-relaxed mb-3">
                    Create your unique Chog NFT with customizable traits and abilities that directly impact gameplay
                    performance and earning potential.
                  </p>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <span className="text-yellow-400 text-sm font-semibold">
                      💡 Pro Tip: Rare traits can increase earnings by up to 300%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-4 group">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                  2
                </div>
                <div>
                  <h4 className="text-2xl font-bold mb-3 text-white">Strategic Board Navigation</h4>
                  <p className="text-gray-300 leading-relaxed mb-3">
                    Roll dice, make strategic moves, and collect ingredients while competing against other players in
                    real-time multiplayer matches.
                  </p>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <span className="text-blue-400 text-sm font-semibold">
                      🎯 Strategy: Plan 3-4 moves ahead to maximize ingredient collection
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-4 group">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                  3
                </div>
                <div>
                  <h4 className="text-2xl font-bold mb-3 text-white">Cook, Craft & Earn Rewards</h4>
                  <p className="text-gray-300 leading-relaxed mb-3">
                    Combine ingredients to create valuable items, unlock Special Boxes, and earn tokens through skilled
                    gameplay and strategic timing.
                  </p>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                    <span className="text-purple-400 text-sm font-semibold">
                      💰 Rewards: Top players earn $500-2000+ monthly
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <Link
                href="/demo"
                className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-green-500/25 transition-all transform hover:scale-105"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Try Live Demo</span>
              </Link>
            </div>
          </div>

          <div className="order-1 lg:order-2 relative">
            <div className="relative bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg">
                🔥 LIVE NOW
              </div>

              <Image
                src="/assets/stove-u.png"
                width={500}
                height={500}
                alt="UniRamble Game Board"
                className="mx-auto opacity-90 hover:opacity-100 transition-opacity"
              />

              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-black/40 backdrop-blur-lg rounded-xl p-4 text-center border border-white/10">
                  <div className="text-2xl font-bold text-yellow-400">8.2K</div>
                  <div className="text-gray-400 text-sm">NFTs Minted</div>
                </div>
                <div className="bg-black/40 backdrop-blur-lg rounded-xl p-4 text-center border border-white/10">
                  <div className="text-2xl font-bold text-green-400">$450K</div>
                  <div className="text-gray-400 text-sm">Rewards Paid</div>
                </div>
                <div className="bg-black/40 backdrop-blur-lg rounded-xl p-4 text-center border border-white/10">
                  <div className="text-2xl font-bold text-blue-400">15K+</div>
                  <div className="text-gray-400 text-sm">Active Players</div>
                </div>
              </div>
            </div>

            {/* Floating UI Elements */}
            <div className="absolute -top-8 -left-8 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-4 py-2 rounded-2xl font-bold text-sm shadow-xl animate-bounce">
              +$25 Earned!
            </div>
            <div className="absolute -bottom-4 -right-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-2xl font-bold text-sm shadow-xl animate-pulse">
              Special Box Unlocked!
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GameMechanics;
