import type { Metadata } from "next";
import Providers from "@/providers/Providers";
import "@/index.css";

export const metadata: Metadata = {
  title: "Money Management App",
  description: "Track income, expenses, transfers, accounts, and balances.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
