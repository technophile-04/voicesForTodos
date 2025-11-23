import type { Metadata } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Message Vault - Farcaster Mini App",
  description: "Buy a spot on the grid and leave your message on-chain! Higher bids can overwrite messages.",
  openGraph: {
    title: "Message Vault",
    description: "Buy a spot on the grid and leave your message on-chain!",
    images: [
      {
        url: `${appUrl}/thumbnail_miniapp.jpg`,
        width: 1200,
        height: 800,
        alt: "Message Vault Grid",
      },
    ],
  },
  other: {
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: `${appUrl}/thumbnail_miniapp.jpg`,
      button: {
        title: "Message Vault",
        action: {
          url: `${appUrl}/miniapp`,
        },
      },
    }),
  },
};

export default function MiniappLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
