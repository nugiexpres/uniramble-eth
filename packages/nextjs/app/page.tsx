import type { Metadata } from "next";
import ClientPage from "~~/components/page/ClientPage";

// SEO Metadata - diproses di server untuk SEO optimal
export const metadata: Metadata = {
  title: "UniRamble - The Future of Web3 Gaming Investment",
  description:
    "Play. Compete. Profit. Join UniRamble where gameplay meets real financial growth through NFTs and blockchain-powered rewards.",
  keywords: ["Web3 gaming", "NFT", "blockchain", "gaming investment", "crypto gaming", "play to earn"],
  authors: [{ name: "UniRamble Team" }],
  creator: "UniRamble",
  publisher: "UniRamble",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://uniramble.xyz"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://uniramble.xyz", // ganti Real domain
    title: "UniRamble - The Future of Web3 Gaming Platform",
    description:
      "Play. Compete. Profit. Join UniRamble where gameplay meets real financial growth through NFTs and blockchain-powered rewards.",
    siteName: "UniRamble",
    images: [
      {
        url: "/uniramble.png", // ganti yg sesuai
        width: 1200,
        height: 630,
        alt: "UniRamble - Web3 Gaming Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UniRamble - The Future of Web3 Gaming Investment",
    description:
      "Play. Compete. Profit. Join UniRamble where gameplay meets real financial growth through NFTs and blockchain-powered rewards.",
    images: ["/uniramble.png"],
    creator: "@uniramble",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code", // TODO: Tambahkan Google Search Console verification
  },
};

// Structured Data untuk SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "UniRamble",
  description: "Web3 Gaming Investment Platform",
  url: "https://uniramble.com",
  applicationCategory: "Game",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    category: "Gaming",
  },
  author: {
    "@type": "Organization",
    name: "UniRamble",
  },
};

export default function Home() {
  return (
    <>
      {/* Structured Data Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      {/* Client Component Wrapper */}
      <ClientPage />
    </>
  );
}
