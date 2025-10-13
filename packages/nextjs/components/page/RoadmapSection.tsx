const RoadmapSection = () => {
  const roadmapItems = [
    {
      quarter: "Q3 2025",
      title: "Genesis Launch",
      status: "completed",
      items: [
        "✅ Core gameplay mechanics",
        "✅ NFT minting system",
        "✅ Basic reward structure",
        "✅ Community building",
      ],
      color: "from-green-500 to-emerald-600",
    },
    {
      quarter: "Q4 2025",
      title: "Enhanced Features",
      status: "active",
      items: ["🔥 Advanced cooking system", "🔥 Guild functionality", "🔥 Tournament mode", "🔥 Mobile app beta"],
      color: "from-blue-500 to-cyan-600",
    },
    {
      quarter: "Q1 2026",
      title: "Ecosystem Expansion",
      status: "upcoming",
      items: [
        "🔮 Cross-chain integration",
        "🔮 NFT marketplace v2",
        "🔮 DeFi yield farming",
        "🔮 Strategic partnerships",
      ],
      color: "from-purple-500 to-pink-600",
    },
    {
      quarter: "Q2 2026",
      title: "Global Scaling",
      status: "planned",
      items: [
        "🚀 Multi-language support",
        "🚀 eSports tournaments",
        "🚀 Metaverse integration",
        "🚀 Institutional partnerships",
      ],
      color: "from-orange-500 to-red-600",
    },
  ];

  return (
    <section id="roadmap" className="py-20 bg-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl lg:text-6xl font-black mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Development Roadmap
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto">
            Our strategic roadmap focuses on sustainable growth, community building, and long-term value creation for
            both players and investors.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {roadmapItems.map((item, index) => (
            <div
              key={index}
              className={`relative group hover:transform hover:scale-105 transition-all duration-300 ${
                item.status === "completed"
                  ? "bg-gradient-to-br from-green-900/40 to-emerald-900/40"
                  : item.status === "active"
                    ? "bg-gradient-to-br from-blue-900/40 to-cyan-900/40"
                    : item.status === "upcoming"
                      ? "bg-gradient-to-br from-purple-900/40 to-pink-900/40"
                      : "bg-gradient-to-br from-orange-900/40 to-red-900/40"
              } backdrop-blur-lg rounded-3xl p-6 border ${
                item.status === "completed"
                  ? "border-green-400/30"
                  : item.status === "active"
                    ? "border-blue-400/30 ring-2 ring-blue-400/20"
                    : item.status === "upcoming"
                      ? "border-purple-400/30"
                      : "border-orange-400/30"
              }`}
            >
              {item.status === "active" && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                  IN PROGRESS
                </div>
              )}

              <div
                className={`bg-gradient-to-r ${item.color} text-white px-4 py-2 rounded-full text-sm font-bold inline-block mb-4`}
              >
                {item.quarter}
              </div>

              <h4
                className={`text-xl font-bold mb-4 ${
                  item.status === "completed"
                    ? "text-green-400"
                    : item.status === "active"
                      ? "text-blue-400"
                      : item.status === "upcoming"
                        ? "text-purple-400"
                        : "text-orange-400"
                }`}
              >
                {item.title}
              </h4>

              <ul className="text-sm text-gray-300 space-y-3">
                {item.items.map((listItem, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="flex-shrink-0 mt-0.5">{listItem.split(" ")[0]}</span>
                    <span>{listItem.substring(listItem.indexOf(" ") + 1)}</span>
                  </li>
                ))}
              </ul>

              {item.status === "completed" && (
                <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <span className="text-green-400 text-xs font-semibold">✅ COMPLETED AHEAD OF SCHEDULE</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RoadmapSection;
