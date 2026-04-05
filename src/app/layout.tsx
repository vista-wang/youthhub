import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "友料 YouthHub 公测版 - 初中生温暖社区",
  description: "一个面向初中生的轻量级社区，提供安全、积极、解压的交流环境",
  keywords: ["初中生", "社区", "论坛", "学生交流", "YouthHub", "友料"],
  authors: [{ name: "YouthHub Team" }],
  openGraph: {
    title: "友料 YouthHub 公测版 - 初中生温暖社区",
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/50">
          {children}
        </div>
      </body>
    </html>
  );
}
