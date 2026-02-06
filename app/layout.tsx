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
  title: "눈보라 속 여동생 찾기",
  description: "눈보라 속에서 길을 잃은 여동생을 소리와 색감만으로 찾아내는 감각 탐색 게임",
  keywords: ["게임", "3D", "탐색", "눈보라", "웹게임"],
  authors: [{ name: "Swordman Find Sister" }],
  openGraph: {
    title: "눈보라 속 여동생 찾기",
    description: "눈보라 속에서 길을 잃은 여동생을 소리와 색감만으로 찾아내는 감각 탐색 게임",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "눈보라 속 여동생 찾기",
    description: "눈보라 속에서 길을 잃은 여동생을 소리와 색감만으로 찾아내는 감각 탐색 게임",
  },
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
        {children}
      </body>
    </html>
  );
}
