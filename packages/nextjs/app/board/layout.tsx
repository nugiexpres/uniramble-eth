import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Board Game",
  description: "Uni Ramble Board Game Powered by Scaffold-ETH 2 + Metamask Delegation Toolkit",
});

const BoardLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default BoardLayout;
