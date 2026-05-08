"use client";

import { useState } from "react";

interface Props {
  onFetch: (ticker: string) => void;
  loading: boolean;
  stockName: string | null;
}

export default function TickerInput({ onFetch, loading, stockName }: Props) {
  const [ticker, setTicker] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim()) onFetch(ticker.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 flex-wrap">
      <input
        type="text"
        value={ticker}
        onChange={(e) => setTicker(e.target.value.toUpperCase())}
        placeholder="銘柄コード (例: 9984, AAPL)"
        className="px-4 py-2 border border-gray-300 rounded-lg text-base w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={loading || !ticker.trim()}
        className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "取得中..." : "データ取得"}
      </button>
      {stockName && (
        <span className="text-gray-600 text-sm font-medium">{stockName}</span>
      )}
    </form>
  );
}
