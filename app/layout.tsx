import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gas Guru — 以太坊 Gas 费用实时查看与 AI 分析",
  description: "使用公共 RPC 端点实时获取以太坊主网 Gas 费用，结合 AI 智能分析给出交易时机建议。无需配置 API Key，开箱即用。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-zinc-950`}
      >
        {children}
      </body>
    </html>
  );
}
