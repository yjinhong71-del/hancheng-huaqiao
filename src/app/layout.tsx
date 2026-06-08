import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navigation from "@/components/Navigation";
import { LanguageProvider } from "@/components/LanguageProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });


export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "漢城華僑中學 – 人物評價",
  description: "漢城華僑中學人物評價平台",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-TW">
      <body className={`${inter.className} `}>
        <LanguageProvider>
          <Navigation />
          <main className="pt-20 pb-safe">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
