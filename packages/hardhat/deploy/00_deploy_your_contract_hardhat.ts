import { HardhatRuntimeEnvironment } from "hardhat/types";
import "hardhat-deploy";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Complete deployment script for Food Game ecosystem
 * Includes BurgerBox, SpecialBox, FasterRegister, FasterReward, FasterTx and all dependencies
 */
const deployUniHardhat: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Helper function to add delay between deployments (avoid rate limiting)
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Check if we're on Monad Testnet (chain ID 10143)
  const chainId = await hre.getChainId();
  const isMonadTestnet = chainId === "10143";
  const deployDelay = isMonadTestnet ? 2000 : 5000; // 2s for Monad, 5s for sepolia (TODO: need upgrade alchemy subscription to remove this delay)

  console.log("🚀 Starting Food Game ecosystem deployment...");
  console.log(`📋 Deployer: ${deployer}`);
  console.log(`🔗 Chain ID: ${chainId}`);
  if (isMonadTestnet) {
    console.log(
      "⚠️  Monad Testnet detected - using rate limit protection (TODO: need upgrade alchemy subscription to remove this delay)",
    );
  }

  // ==================== CORE INFRASTRUCTURE ====================

  // 1. Payment Gateway
  console.log("📦 Deploying PaymentGateway...");
  await deploy("PaymentGateway", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
  const PaymentGatewayContract = await hre.deployments.get("PaymentGateway");
  await delay(deployDelay);

  // 2. Food NFT (Base NFT for characters)
  console.log("📦 Deploying FoodNFT...");
  await deploy("FoodNFT", {
    from: deployer,
    args: [
      PaymentGatewayContract.address, // _paymentGateway
    ],
    log: true,
    autoMine: true,
  });
  const foodNFTContract = await hre.deployments.get("FoodNFT");
  await delay(deployDelay);

  // 3. ERC6551 Token Bound Account Infrastructure
  console.log("📦 Deploying ERC6551 infrastructure...");
  await deploy("ERC6551Registry", {
    from: deployer,
    log: true,
    autoMine: true,
  });
  const registryContract = await hre.deployments.get("ERC6551Registry");
  await delay(deployDelay);

  await deploy("ERC6551Account", {
    from: deployer,
    log: true,
    autoMine: true,
  });
  const erc6551AccountDeployment = await hre.deployments.get("ERC6551Account");
  await delay(deployDelay);

  await deploy("ERC6551AccountProxy", {
    from: deployer,
    args: [
      erc6551AccountDeployment.address, // implementation
      "0x", // initData empty bytes
    ],
    log: true,
    autoMine: true,
  });
  await delay(deployDelay);

  // ==================== GAME TOKENS (INGREDIENTS) ====================

  console.log("📦 Deploying ingredient tokens...");

  // Bread Token
  await deploy("BreadToken", {
    from: deployer,
    args: [], // Constructor: ERC20("Bread", "BT") Ownable(msg.sender)
    log: true,
    autoMine: true,
  });
  const BreadContract = await hre.deployments.get("BreadToken");

  // Meat Token
  await deploy("MeatToken", {
    from: deployer,
    args: [], // Constructor: ERC20("Meat", "MT") Ownable(msg.sender)
    log: true,
    autoMine: true,
  });
  const MeatContract = await hre.deployments.get("MeatToken");

  // Lettuce Token
  await deploy("LettuceToken", {
    from: deployer,
    args: [], // Constructor: ERC20("Lettuce", "LT") Ownable(msg.sender)
    log: true,
    autoMine: true,
  });
  const LettuceContract = await hre.deployments.get("LettuceToken");

  // Tomato Token
  await deploy("TomatoToken", {
    from: deployer,
    args: [], // Constructor: ERC20("Tomato", "TM") Ownable(msg.sender)
    log: true,
    autoMine: true,
  });
  const TomatoContract = await hre.deployments.get("TomatoToken");

  // Spice Token
  await deploy("SpiceToken", {
    from: deployer,
    args: [], // Constructor: ERC20("SpiceToken", "SPICE") - no Ownable
    log: true,
    autoMine: true,
  });

  // ==================== GAME TICKET SYSTEMS ====================

  console.log("📦 Deploying game ticket systems...");

  // BurgerBox (ERC1155) - Game tickets for various mini-games
  // await deploy("BurgerBox", {
  //   from: deployer,
  //   args: [
  //     "https://ipfs.4everland.io/ipfs/bafkreigval3k336rajx65sfbocmmudjriqp7zls56oaa2x4qghekdadeg4/{id}.json",
  //     deployer, // admin address
  //   ],
  //   log: true,
  //   autoMine: true,
  // });
  // const BurgerBoxContract = await hre.deployments.get("BurgerBox");

  // ==================== UTILITY CONTRACTS ====================

  console.log("📦 Deploying utility contracts...");

  // Faucet for native MON tokens
  await deploy("FaucetMon", {
    from: deployer,
    log: true,
    autoMine: true,
  });
  const FaucetMonContract = await hre.deployments.get("FaucetMon");

  // Marketplace for trading
  // await deploy("UnirambleMarketplace", {
  //   from: deployer,
  //   args: [], // Constructor: Ownable(msg.sender)
  //   log: true,
  //   autoMine: true,
  // });

  // Reward Pool for game rewards
  await deploy("RewardPool", {
    from: deployer,
    args: [], // Constructor: Ownable(msg.sender)
    log: true,
    autoMine: true,
  });
  const RewardPoolContract = await hre.deployments.get("RewardPool");

  // ==================== MAIN GAME CONTRACTS ====================

  console.log("📦 Deploying main game contracts...");

  // FoodScramble - Main game contract
  await deploy("FoodScramble", {
    from: deployer,
    args: [
      deployer,
      registryContract.address,
      BreadContract.address,
      MeatContract.address,
      LettuceContract.address,
      TomatoContract.address,
      foodNFTContract.address,
      FaucetMonContract.address,
      PaymentGatewayContract.address,
    ],
    log: true,
    autoMine: true,
  });
  // const FoodScrambleContract = await hre.deployments.get("FoodScramble");

  // SpecialBox (ERC721) - Special ticket for daily reward
  // await deploy("SpecialBox", {
  //   from: deployer,
  //   args: [foodNFTContract.address, FoodScrambleContract.address, PaymentGatewayContract.address],
  //   log: true,
  //   autoMine: true,
  // });
  // const SpecialBoxContract = await hre.deployments.get("SpecialBox");

  // SpecialBoxStake - Staking system for SpecialBox NFTs
  // console.log("📦 Deploying SpecialBoxStake...");
  // await deploy("SpecialBoxStake", {
  //   from: deployer,
  //   args: [
  //     SpecialBoxContract.address,
  //     FoodScrambleContract.address,
  //     foodNFTContract.address,
  //     PaymentGatewayContract.address,
  //   ],
  //   log: true,
  //   autoMine: true,
  // });
  // const SpecialBoxStakeContract = await hre.deployments.get("SpecialBoxStake");

  // ==================== FASTER GAME ECOSYSTEM ====================

  // console.log("📦 Deploying Faster Game ecosystem...");

  // FasterRegister - Player registration and stats management
  // await deploy("FasterRegister", {
  //   from: deployer,
  //   args: [
  //     PaymentGatewayContract.address, // paymentGateway
  //     FoodScrambleContract.address, // foodScramble (for TBA management)
  //   ],
  //   log: true,
  //   autoMine: true,
  // });
  // const FasterRegisterContract = await hre.deployments.get("FasterRegister");

  // FasterReward - Reward system management
  // await deploy("FasterReward", {
  //   from: deployer,
  //  args: [
  //     deployer, // initialOwner for Ownable(msg.sender)
  //     RewardPoolContract.address, // rewardPool
  //     SpecialBoxContract.address, // specialBox
  //     BurgerBoxContract.address, // burgerBox
  //     // FasterRegisterContract.address, // fasterRegister
  //   ],
  //   log: true,
  //   autoMine: true,
  // });
  // const FasterRewardContract = await hre.deployments.get("FasterReward");

  // FasterTx - Speed test game (updated version)
  // await deploy("FasterTx", {
  //   from: deployer,
  //   args: [
  //     deployer, // initialOwner for Ownable(msg.sender)
  //     SpecialBoxContract.address, // specialBox
  //     FasterRegisterContract.address, // fasterRegister
  //     FasterRewardContract.address, // fasterReward
  //   ],
  //   log: true,
  //   autoMine: true,
  // });
  // const FasterTxContract = await hre.deployments.get("FasterTx");

  // ==================== DEPLOYMENT SUMMARY ====================

  console.log("\n🎉 Food Game ecosystem deployment completed!");
  console.log("=".repeat(60));
  console.log("📋 CONTRACT ADDRESSES:");
  console.log("=".repeat(60));

  // Core Infrastructure
  console.log("\n🏗️ CORE INFRASTRUCTURE:");
  console.log(`PaymentGateway:     ${PaymentGatewayContract.address}`);
  console.log(`FoodNFT:           ${foodNFTContract.address}`);
  console.log(`ERC6551Registry:   ${registryContract.address}`);
  console.log(`ERC6551Account:    ${erc6551AccountDeployment.address}`);

  // Game Tokens
  console.log("\n🍞 INGREDIENT TOKENS:");
  console.log(`BreadToken:        ${BreadContract.address}`);
  console.log(`MeatToken:         ${MeatContract.address}`);
  console.log(`LettuceToken:      ${LettuceContract.address}`);
  console.log(`TomatoToken:       ${TomatoContract.address}`);

  // Game Systems
  console.log("\n🎮 GAME SYSTEMS:");
  // console.log(`BurgerBox (ERC1155): ${BurgerBoxContract.address}`);
  // console.log(`SpecialBox (ERC721): ${SpecialBoxContract.address}`);
  // console.log(`SpecialBoxStake:     ${SpecialBoxStakeContract.address}`);

  // Faster Game Ecosystem
  console.log("\n⚡ FASTER GAME ECOSYSTEM:");
  // console.log(`FasterRegister:    ${FasterRegisterContract.address}`);
  // console.log(`FasterReward:      ${FasterRewardContract.address}`);
  // console.log(`FasterTx:          ${FasterTxContract.address}`);

  // Utility
  console.log("\n🔧 UTILITIES:");
  console.log(`RewardPool:        ${RewardPoolContract.address}`);
  console.log(`FaucetMon:         ${FaucetMonContract.address}`);

  console.log("=".repeat(60));
  console.log("\n📝 AUTOMATIC CONFIGURATION COMPLETED:");
  console.log("=".repeat(60));
  console.log("✅ Token contracts (BreadToken, MeatToken, LettuceToken, TomatoToken) configured");
  console.log("✅ FoodNFT contract configured with FoodScramble address");
  console.log("✅ FaucetMon contract configured with FoodScramble as allowed caller");
  console.log("=".repeat(60));

  console.log("\n📝 MANUAL CONFIGURATION REQUIRED:");
  console.log("=".repeat(60));

  // FasterRegister Configuration
  console.log("\n🔧 FASTERREGISTER CONFIGURATION:");
  // console.log("• addAuthorizedGameContract(FasterTxContract.address)");
  // console.log("• setRegistrationFee(amount) - if different from default 0.2 ether");
  console.log("• emergencyFundTBA(tbaAddress) - for testing purposes");

  // FasterReward Configuration
  console.log("\n🎁 FASTERREWARD CONFIGURATION:");
  // console.log("• addAuthorizedGameContract(FasterTxContract.address)");
  // console.log("• setRewardConfig(burgerBoxId, amount, monAmount, bombChance, burgerChance, monChance)");
  console.log("  Example: setRewardConfig(1, 1, parseEther('0.1'), 3000, 4000, 3000)");
  console.log("• setDefaultWeeklyRewardAmount(parseEther('5'))");
  console.log("• setDefaultMaxRankForWeeklyReward(5)");
  console.log("• fundContract() - send MON for daily rewards");

  // RewardPool Configuration
  console.log("\n💰 REWARDPOOL CONFIGURATION:");
  // console.log("• setDistributor(FasterRewardContract.address, true)");
  console.log("• deposit() - fund with MON for weekly rewards");

  // BurgerBox Configuration
  console.log("\n🍔 BURGERBOX CONFIGURATION:");
  // console.log("• grantRole(MINTER_ROLE, FasterRewardContract.address)");
  // console.log("• grantRole(MINTER_ROLE, SpecialBoxContract.address) - if SpecialBox mints BurgerBox");

  // SpecialBox Configuration
  // console.log("\n📦 SPECIALBOX CONFIGURATION:");
  // console.log("• grantRole(MINTER_ROLE, deployer or authorized minter)");
  // console.log("• setRewardConfig() - if SpecialBox has reward system");
  // console.log("• fundContract() - if SpecialBox distributes MON rewards");

  // FaucetMon Configuration
  console.log("\n💧 FAUCETMON CONFIGURATION:");
  console.log("• fundFaucet() - fund the faucet with native tokens for distribution");
  console.log("• Note: FoodScramble is already set as allowed caller");

  // SpecialBoxStake Configuration
  // console.log("\n🔒 SPECIALBOXSTAKE CONFIGURATION:");
  // console.log("• setStakeRewardRate() - configure reward rates");
  // console.log("• setUnstakeCooldown() - configure cooldown period");
  // console.log("• fundContract() - fund with reward tokens");
  // console.log("• Test registration flow through FasterRegister");
  // console.log("• Test reward distribution through FasterReward");
  // console.log("• Test game flow through FasterTx");

  console.log("\n🧪 TESTING CHECKLIST:");
  console.log("• Deploy to testnet first");
  console.log("• Test complete user journey: TBA creation → Registration → Play game → Claim rewards");
  console.log("• Test SpecialBox minting and burning flow");
  console.log("• Test SpecialBoxStake staking and unstaking flow");
  console.log("• Verify all role assignments are correct");
  console.log("• Test emergency functions");
  console.log("• Verify fund flows between contracts");

  console.log("\n💡 RECOMMENDED CONFIGURATION VALUES:");
  // console.log("• FasterRegister registration fee: 0.2 ETH");
  // console.log("• FasterReward daily reward: 30% bomb, 40% BurgerBox, 30% MON (0.1 ETH)");
  console.log("• FasterReward weekly reward: 5 MON for top 5 players");
  console.log("• RewardPool initial funding: 1000 MON");
  // console.log("• FasterReward contract funding: 5-20 ETH for daily rewards");

  console.log("=".repeat(60));
};

export default deployUniHardhat;

// Updated tags to include all deployed contracts
deployUniHardhat.tags = [
  "UniHardhat",
  "PaymentGateway",
  "FoodNFT",
  "ERC6551Registry",
  "ERC6551Account",
  "ERC6551AccountProxy",
  "BreadToken",
  "MeatToken",
  "LettuceToken",
  "TomatoToken",
  "SpiceToken",
  // "BurgerBox",
  "SpecialBox",
  "SpecialBoxStake",
  // "UnirambleMarketplace",
  "RewardPool",
  "FoodScramble",
  // "FasterRegister",
  // "FasterReward",
  // "FasterTx",
  "GameEcosystem",
];
