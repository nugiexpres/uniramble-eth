import { useEffect, useState } from "react";
import { ethers } from "ethers";

export function useProvider() {
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);

  useEffect(() => {
    const initProvider = async () => {
      try {
        const localProvider = new ethers.JsonRpcProvider("http://localhost:8545");
        await localProvider.getNetwork();
        setProvider(localProvider);
      } catch (error) {
        console.error("Failed to connect to localhost:", error);
        if (window.ethereum) {
          try {
            const web3Provider = new ethers.JsonRpcProvider(window.ethereum);
            setProvider(web3Provider);
          } catch (metamaskError) {
            console.error("Failed to connect to MetaMask:", metamaskError);
            // Fallback to null provider if both localhost and MetaMask fail
            setProvider(null);
          }
        } else {
          console.warn("MetaMask not detected");
          setProvider(null);
        }
      }
    };

    initProvider();
  }, []);

  return provider;
}
