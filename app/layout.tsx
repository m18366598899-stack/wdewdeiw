import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "情侣积分管理",
  description: "双人共享、双向确认、实时同步的温柔积分管理应用。",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "情侣积分管理",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#fff8ef"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
