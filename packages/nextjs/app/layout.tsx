import "@rainbow-me/rainbowkit/styles.css";
import { MobileWarning } from "~~/components/MobileWarning";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { GlobalModalProvider } from "~~/contexts/GlobalModalContext";
import { MetaMaskProvider } from "~~/providers/MetaMaskProvider";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

// import { Web3AuthProvider } from "~~/components/Web3AuthProvider"; // Opt-in: uncomment when configured

export const metadata = getMetadata({
  title: "UniRamble GamiFi",
  description: "Combine NFT and explore the world of GamiFi with Smart Account + EIP-7710 delegation features",
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider enableSystem>
          <MetaMaskProvider>
            <GlobalModalProvider>
              <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
              <MobileWarning />
            </GlobalModalProvider>
          </MetaMaskProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
