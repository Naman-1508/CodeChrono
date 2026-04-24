import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkClientProvider } from "@/components/ClerkClientProvider";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CodeChrono — Explore Any GitHub Repo Through Time",
  description:
    "Turn any GitHub repository into an interactive visual timeline. Explore commit history, file evolution, and code chapters — no AI, no setup.",
  keywords: ["github", "git", "timeline", "code history", "repository explorer"],
  openGraph: {
    title: "CodeChrono",
    description: "Visual Git timeline explorer for any GitHub repository",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClerkClientProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkClientProvider>
      </body>
    </html>
  );
}
