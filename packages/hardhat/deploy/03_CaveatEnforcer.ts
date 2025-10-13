import { HardhatRuntimeEnvironment } from "hardhat/types";
import "hardhat-deploy";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploy CaveatEnforcer contract
 * This contract implements ICaveatEnforcer for delegation rules enforcement
 */
const deployCaveatEnforcer: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("🔒 Deploying CaveatEnforcer...");
  console.log(`📋 Deployer: ${deployer}`);

  // Deploy BasicCaveatEnforcer
  await deploy("BasicCaveatEnforcer", {
    from: deployer,
    args: [deployer], // initialOwner for Ownable(msg.sender)
    log: true,
    autoMine: true,
  });

  const caveatEnforcerContract = await hre.deployments.get("BasicCaveatEnforcer");

  console.log("\n🎉 CaveatEnforcer deployment completed!");
  console.log("=".repeat(50));
  console.log(`📋 CONTRACT ADDRESS: ${caveatEnforcerContract.address}`);
  console.log("=".repeat(50));

  console.log("\n📝 CAVEAT ENFORCER FEATURES:");
  console.log("• Spending Limit Enforcement");
  console.log("• Allowed Targets Enforcement");
  console.log("• Time Limit Enforcement");
  console.log("• MetaMask Delegation Toolkit Compatible");

  console.log("\n🔧 USAGE:");
  console.log("• Set spending limits: setSpendingLimit(delegationHash, token, maxAmount, validUntil)");
  console.log("• Set time limits: setTimeLimit(delegationHash, validUntil)");
  console.log("• Set allowed targets: setAllowedTargets(delegationHash, targets)");
  console.log("• Enforce before execution: beforeHook(terms, args, mode, executionCalldata, delegationHash)");
  console.log("• Enforce after execution: afterHook(terms, args, mode, executionCalldata, delegationHash)");

  console.log("\n💡 INTEGRATION:");
  console.log("• Use this contract address in your delegation system");
  console.log("• Replace placeholder addresses in useDelegation.ts hook");
  console.log("• Update CaveatEnforcer contract address in frontend");
};

export default deployCaveatEnforcer;

// Tag for selective deployment
deployCaveatEnforcer.tags = ["CaveatEnforcer", "Delegation", "MetaMask"];
