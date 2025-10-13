import { useMemo } from "react";
import { useSmartAccountTBA as useEnvioSmartAccountTBA } from "./useGameEvents";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useFinalSmartAccount } from "~~/hooks/smart-account/useFinalSmartAccount";

/**
 * Hook untuk mendapatkan TBA address dari Smart Account
 * Menggabungkan data dari contract dan Envio indexer
 */
export const useSmartAccountTBA = () => {
  const { address } = useAccount();
  const { smartAccountAddress, isDeployed: isSmartAccountDeployed } = useFinalSmartAccount();

  // Get TBA from Smart Account via contract
  const { data: contractTBA, refetch: refetchContractTBA } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "tbaList",
    args: [smartAccountAddress ?? "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!smartAccountAddress && isSmartAccountDeployed,
    },
    watch: true,
  });

  // Get TBA from Envio indexer
  const {
    tbaData: envioTbaData,
    latestTBA: envioLatestTBA,
    loading: envioLoading,
  } = useEnvioSmartAccountTBA(smartAccountAddress ? smartAccountAddress : undefined);

  // Determine the best TBA address to use
  const effectiveTbaAddress = useMemo(() => {
    // Priority: Envio latest TBA > Contract TBA > null
    if (envioLatestTBA?.tba && envioLatestTBA.tba !== "0x0000000000000000000000000000000000000000") {
      return envioLatestTBA.tba;
    }

    if (contractTBA && contractTBA !== "0x0000000000000000000000000000000000000000") {
      return contractTBA;
    }

    return null;
  }, [envioLatestTBA?.tba, contractTBA]);

  // Debug logging
  console.log("=== useSmartAccountTBA Debug ===");
  console.log("EOA Address:", address);
  console.log("Smart Account Address:", smartAccountAddress);
  console.log("Smart Account Deployed:", isSmartAccountDeployed);
  console.log("Contract TBA:", contractTBA);
  console.log("Envio Latest TBA:", envioLatestTBA?.tba);
  console.log("Effective TBA Address:", effectiveTbaAddress);
  console.log("Envio Loading:", envioLoading);
  console.log("================================");

  return {
    // TBA Address
    tbaAddress: effectiveTbaAddress,

    // Source information
    contractTBA,
    envioTBA: envioLatestTBA?.tba,
    tbaSource: effectiveTbaAddress === envioLatestTBA?.tba ? "envio" : "contract",

    // Smart Account info
    smartAccountAddress,
    isSmartAccountDeployed,

    // Envio data
    envioTbaData,
    envioLatestTBA,
    envioLoading,

    // Actions
    refetchContractTBA,
  };
};
