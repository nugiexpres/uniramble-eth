import { HardhatRuntimeEnvironment } from "hardhat/types";
import "hardhat-deploy";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploy Hybrid Delegation System
 * This includes Hub, Game Caveat Enforcer, Financial Caveat Enforcer, and Legacy CaveatEnforcer
 */
const deployHybridDelegation: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("🔗 Deploying Hybrid Delegation System...");
  console.log(`📋 Deployer: ${deployer}`);

  // Deploy CaveatEnforcerHub
  console.log("\n🏗️ Deploying CaveatEnforcerHub...");
  const hubDeployment = await deploy("CaveatEnforcerHub", {
    from: deployer,
    args: [deployer], // initialOwner
    log: true,
    autoMine: true,
  });

  // Deploy GameCaveatEnforcer
  console.log("\n🎮 Deploying GameCaveatEnforcer...");
  const gameEnforcerDeployment = await deploy("GameCaveatEnforcer", {
    from: deployer,
    args: [deployer], // initialOwner
    log: true,
    autoMine: true,
  });

  // Deploy FinancialCaveatEnforcer
  console.log("\n💰 Deploying FinancialCaveatEnforcer...");
  const financialEnforcerDeployment = await deploy("FinancialCaveatEnforcer", {
    from: deployer,
    args: [deployer], // initialOwner
    log: true,
    autoMine: true,
  });

  // Deploy Legacy CaveatEnforcer (for backward compatibility)
  console.log("\n🔒 Deploying Legacy CaveatEnforcer...");
  const legacyEnforcerDeployment = await deploy("BasicCaveatEnforcer", {
    from: deployer,
    args: [deployer], // initialOwner
    log: true,
    autoMine: true,
  });

  // Auto-setup: Enable enforcers in Hub
  console.log("\n⚙️ Auto-configuring Hub...");
  try {
    const hub = await hre.ethers.getContractAt("CaveatEnforcerHub", hubDeployment.address);

    // Batch enable all enforcers
    const enforcersToEnable = [
      gameEnforcerDeployment.address,
      financialEnforcerDeployment.address,
      legacyEnforcerDeployment.address,
    ];

    console.log("📝 Enabling enforcers in Hub...");
    const enableTx = await hub.batchEnableEnforcers(enforcersToEnable);
    await enableTx.wait();
    console.log("✅ All enforcers enabled!");

    // Set default enforcers
    console.log("📝 Setting default enforcers...");
    const enforcerTypes = ["game", "financial", "basic"];
    const enforcerAddresses = [
      gameEnforcerDeployment.address,
      financialEnforcerDeployment.address,
      legacyEnforcerDeployment.address,
    ];

    const setDefaultTx = await hub.batchSetDefaultEnforcers(enforcerTypes, enforcerAddresses);
    await setDefaultTx.wait();
    console.log("✅ Default enforcers configured!");
  } catch (error) {
    console.warn("⚠️ Auto-configuration failed (may need manual setup):", error);
  }

  console.log("\n🎉 Hybrid Delegation System deployment completed!");
  console.log("=".repeat(60));
  console.log(`🏗️ CAVEAT ENFORCER HUB: ${hubDeployment.address}`);
  console.log(`🎮 GAME CAVEAT ENFORCER: ${gameEnforcerDeployment.address}`);
  console.log(`💰 FINANCIAL CAVEAT ENFORCER: ${financialEnforcerDeployment.address}`);
  console.log(`🔒 LEGACY CAVEAT ENFORCER: ${legacyEnforcerDeployment.address}`);
  console.log("=".repeat(60));

  console.log("\n📝 HYBRID DELEGATION FEATURES:");
  console.log("• Hub-based coordination of multiple enforcers");
  console.log("• Game-specific caveats (roll, rail, buy, faucet, cook)");
  console.log("• Financial caveats (spending limits, token whitelists)");
  console.log("• MetaMask Delegation Toolkit compatibility");
  console.log("• Modular and upgradeable architecture");
  console.log("• Legacy CaveatEnforcer for backward compatibility");
  console.log("• All contracts in single delegation folder for easy management");

  console.log("\n🔧 SETUP INSTRUCTIONS:");
  console.log("1. Enable enforcers in Hub:");
  console.log(`   - Game Enforcer: ${gameEnforcerDeployment.address}`);
  console.log(`   - Financial Enforcer: ${financialEnforcerDeployment.address}`);
  console.log(`   - Legacy Enforcer: ${legacyEnforcerDeployment.address} (optional)`);
  console.log("2. Set default enforcers for delegation types");
  console.log("3. Configure game and financial limits per delegation");
  console.log("4. Update frontend to use Hub address as main enforcer");
  console.log("5. Legacy CaveatEnforcer available for backward compatibility");

  console.log("\n💡 INTEGRATION:");
  console.log("• Use Hub address as the main CaveatEnforcer in delegation system");
  console.log("• Hub will coordinate between Game and Financial enforcers");
  console.log("• Each enforcer handles specific caveat types");
  console.log("• Frontend remains unchanged - only Hub address needs update");

  // Store deployment info for frontend
  const deploymentInfo = {
    hub: hubDeployment.address,
    gameEnforcer: gameEnforcerDeployment.address,
    financialEnforcer: financialEnforcerDeployment.address,
    legacyEnforcer: legacyEnforcerDeployment.address,
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer,
    timestamp: new Date().toISOString(),
  };

  console.log("\n📄 Deployment Info:", JSON.stringify(deploymentInfo, null, 2));
};

export default deployHybridDelegation;

// Tag for selective deployment
deployHybridDelegation.tags = [
  "HybridDelegation",
  "CaveatEnforcerHub",
  "GameCaveatEnforcer",
  "FinancialCaveatEnforcer",
  "BasicCaveatEnforcer",
];
