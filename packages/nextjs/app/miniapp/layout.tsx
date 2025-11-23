import type { Metadata } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Voices For Todos - Character Grid",
  description: "Buy cells to spell out your message on-chain! One character at a time on Celo.",
  openGraph: {
    title: "Voices For Todos",
    description: "Buy cells to spell out your message on-chain! One character at a time.",
    images: [
      {
        url: `${appUrl}/voicesfortodos-icon.jpg`,
        width: 1200,
        height: 1200,
        alt: "Voices For Todos - Message Grid",
      },
    ],
  },
  other: {
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: `${appUrl}/voicesfortodos-banner.jpg`,
      button: {
        title: "Voices For Todos",
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
