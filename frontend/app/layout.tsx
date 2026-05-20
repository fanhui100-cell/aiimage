import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "主图工厂 | AI 电商商品图生成平台",
  description: "面向淘宝、拼多多、抖音小店卖家的 AI 商品图批量生成工具。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full bg-slate-950 text-slate-950 antialiased">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: "8px",
              border: "1px solid rgba(15,23,42,0.08)",
              boxShadow: "0 18px 60px rgba(15,23,42,0.16)",
            },
          }}
        />
      </body>
    </html>
  );
}
