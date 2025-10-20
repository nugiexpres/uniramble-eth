import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployChefNFT: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying ChefNFT...");

  // Get PaymentGateway address from previous deployment
  const paymentGateway = await deployments.get("PaymentGateway");

  const chefNFT = await deploy("ChefNFT", {
    from: deployer,
    args: [paymentGateway.address],
    log: true,
    autoMine: true,
  });

  console.log("ChefNFT deployed to:", chefNFT.address);
};

export default deployChefNFT;
deployChefNFT.tags = ["ChefNFT"];
deployChefNFT.dependencies = ["PaymentGateway"];
