import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navigation from "@/components/Navigation";
import { LanguageProvider } from "@/components/LanguageProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "汉城华侨中学 – 人物评价",
  description: "汉城华侨中学人物评价平台",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} antialiased`}>
        <LanguageProvider>
          <Navigation />
          <main className="pt-14">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
