const TokenomicsSection = () => {
  const tokenomics = [
    {
      percentage: "45%",
      label: "Community & Rewards",
      desc: "Long-term incentives for players",
      color: "from-green-400 to-emerald-500",
    },
    {
      percentage: "25%",
      label: "Development Fund",
      desc: "Continuous platform enhancement",
      color: "from-blue-400 to-cyan-500",
    },
    {
      percentage: "20%",
      label: "Strategic Partnerships",
      desc: "Ecosystem expansion",
      color: "from-purple-400 to-pink-500",
    },
    {
      percentage: "10%",
      label: "Team & Advisors",
      desc: "4-year vesting schedule",
      color: "from-orange-400 to-red-500",
    },
  ];

  return (
    <section id="tokenomics" className="py-20 bg-gradient-to-r from-black/40 to-gray-900/40 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl lg:text-6xl font-black mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Investment Opportunity
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Join the GameFi revolution with a proven economic model, experienced team, and rapidly growing community of
            engaged players and investors.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {tokenomics.map((item, index) => (
            <div key={index} className="text-center group">
              <div
                className={`bg-gradient-to-r ${item.color} w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
              >
                <div className="text-3xl font-black text-white">{item.percentage}</div>
              </div>
              <div className="text-white font-bold text-lg mb-2">{item.label}</div>
              <div className="text-gray-400 text-sm">{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6 text-white">Why UniRamble is the Next Big Investment</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-500 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Proven Revenue Model</h4>
                    <p className="text-gray-400 text-sm">
                      Multiple revenue streams including NFT trading, tournament fees, and premium features
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-500 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Sustainable Growth</h4>
                    <p className="text-gray-400 text-sm">
                      Built for long-term sustainability with deflationary tokenomics and utility-driven demand
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-500 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Strong Community</h4>
                    <p className="text-gray-400 text-sm">
                      Active player base with high retention and organic growth through referrals
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl p-8 border border-yellow-500/30">
                <div className="text-center">
                  <div className="text-5xl font-black text-yellow-400 mb-2">$2.4M+</div>
                  <div className="text-lg font-semibold text-white mb-4">Total Value Locked</div>
                  <div className="text-green-400 font-bold text-lg">+245% Growth (90 days)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TokenomicsSection;
