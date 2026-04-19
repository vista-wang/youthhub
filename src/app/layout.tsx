import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "友料YouthHub Beta 2 - 初中生温暖社区",
  description: "一个面向初中生的轻量级社区，提供安全、积极、解压的交流环境",
  keywords: ["初中生", "社区", "论坛", "学生交流", "YouthHub", "友料"],
  authors: [{ name: "YouthHub Team" }],
  openGraph: {
    title: "友料YouthHub Beta 2 - 初中生温暖社区",
    description: "一个面向初中生的轻量级社区，提供安全、积极、解压的交流环境",
    type: "website",
    locale: "zh_CN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        <ToastProvider>
          <div className="min-h-screen bg-slate-50">
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
