import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buy & Hold vs あなたのトレード | 株式売買シミュレーター",
  description:
    "1年前に買って放置していたら? 人間の裁量トレードとBuy & Holdを比較体験。頻繁な売買がパフォーマンスを悪化させることを直感的に体験できるシミュレーター。",
  keywords: [
    "株式",
    "シミュレーター",
    "Buy and Hold",
    "裁量トレード",
    "投資",
    "比較",
    "株価",
    "長期投資",
  ],
  openGraph: {
    title: "Buy & Hold vs あなたのトレード | 株式売買シミュレーター",
    description:
      "1年前に買って放置 vs 裁量トレード。頻繁な売買は本当に得なのか? 体験型シミュレーター。",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary",
    title: "Buy & Hold vs あなたのトレード",
    description:
      "株式売買シミュレーター。放置 vs 裁量トレードを比較体験。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
