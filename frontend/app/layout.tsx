import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import AIChatButton from "./components/common/AIChatButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShopLogo - 온라인 쇼핑몰",
  description: "최고의 상품을 만나보세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <main className="flex flex-col">
            <div className="mx-auto max-w-7xl w-full p-8 flex-1">
              {children}
            </div>
            <Footer />
          </main>
        </div>
        <AIChatButton />
      </body>
    </html>
  );
}
