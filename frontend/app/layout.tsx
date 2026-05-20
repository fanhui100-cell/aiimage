import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt123 | 高质量中文 AI 提示词库",
  description: "面向 GPT-Image-2、Gemini Nano Banana、Midjourney 和视频生成平台的中文提示词库与 AI 图像生成工作台。",
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
