import { useState } from "react";
import Image from "next/image";

const FeaturesSection = () => {
  const [activeTab, setActiveTab] = useState("players");

  return (
    <section id="features" className="py-20 bg-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl lg:text-6xl font-black mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Built for Long-Term Value
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            UniRamble combines sustainable tokenomics, true asset ownership, and engaging gameplay mechanics that reward
            both casual players and serious investors.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-16">
          <div className="bg-black/40 backdrop-blur-lg rounded-full p-2 border border-white/10">
            <button
              onClick={() => setActiveTab("players")}
              className={`px-8 py-3 rounded-full font-bold transition-all ${
                activeTab === "players"
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              For Players
            </button>
            <button
              onClick={() => setActiveTab("investors")}
              className={`px-8 py-3 rounded-full font-bold transition-all ${
                activeTab === "investors"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              For Investors
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {activeTab === "players" ? (
            <>
              <div className="group bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-lg rounded-3xl p-8 border border-green-500/20 hover:border-green-400/40 transition-all hover:transform hover:scale-105">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Image src="/assets/chog.png" width={40} height={40} alt="Play to Earn" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-green-400">Play Smarter. Earn Bigger.</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Your skills in UniRamble translate directly into rewards, NFTs, and token earnings you truly own.
                  Every strategic move builds real value.
                </p>
                <div className="text-green-400 font-semibold text-sm">Average Monthly Earnings: $150-500</div>
              </div>

              <div className="group bg-gradient-to-br from-blue-900/30 to-cyan-900/30 backdrop-blur-lg rounded-3xl p-8 border border-blue-500/20 hover:border-blue-400/40 transition-all hover:transform hover:scale-105">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Image src="/assets/uni-recycle.png" width={40} height={40} alt="Own Assets" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-blue-400">From Casual Play to Financial Gain</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  UniRamble lets you enjoy gaming while building real value for your digital future. Own your assets,
                  trade them, or stake for passive income.
                </p>
                <div className="text-blue-400 font-semibold text-sm">NFT Floor Price: +340% in 90 days</div>
              </div>

              <div className="group bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-8 border border-purple-500/20 hover:border-purple-400/40 transition-all hover:transform hover:scale-105">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Image src="/assets/special-box.png" width={40} height={40} alt="Competitive" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-purple-400">Gaming That Pays Off</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Every move, every strategy, every victory – it is all connected to your financial growth. Compete in
                  tournaments for exclusive rewards.
                </p>
                <div className="text-purple-400 font-semibold text-sm">Tournament Prize Pool: $50K+ monthly</div>
              </div>
            </>
          ) : (
            <>
              <div className="group bg-gradient-to-br from-yellow-900/30 to-orange-900/30 backdrop-blur-lg rounded-3xl p-8 border border-yellow-500/20 hover:border-yellow-400/40 transition-all hover:transform hover:scale-105">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-yellow-400">Sustainable Revenue Model</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  UniRamble is designed for sustainable tokenomics with deflationary mechanisms, creating a healthy
                  ecosystem where value compounds over time.
                </p>
                <div className="text-yellow-400 font-semibold text-sm">Revenue Growth: +245% QoQ</div>
              </div>

              <div className="group bg-gradient-to-br from-emerald-900/30 to-teal-900/30 backdrop-blur-lg rounded-3xl p-8 border border-emerald-500/20 hover:border-emerald-400/40 transition-all hover:transform hover:scale-105">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6.5A2.5 2.5 0 0115.5 17h-11A2.5 2.5 0 012 14.5V8a2 2 0 012-2h2zm6-1a1 1 0 00-1-1H9a1 1 0 00-1 1v1h4V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-emerald-400">NFTs With Real Utility</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Every asset in UniRamble has a purpose beyond collectibles. NFTs generate yield, unlock gameplay
                  features, and appreciate based on utility.
                </p>
                <div className="text-emerald-400 font-semibold text-sm">NFT Staking APY: 45-120%</div>
              </div>

              <div className="group bg-gradient-to-br from-violet-900/30 to-purple-900/30 backdrop-blur-lg rounded-3xl p-8 border border-violet-500/20 hover:border-violet-400/40 transition-all hover:transform hover:scale-105">
                <div className="bg-gradient-to-r from-violet-500 to-purple-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-violet-400">Growing Community Value</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Invest early and grow alongside our expanding community. Network effects drive token value as more
                  players join the ecosystem.
                </p>
                <div className="text-violet-400 font-semibold text-sm">User Growth: +120% monthly</div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
