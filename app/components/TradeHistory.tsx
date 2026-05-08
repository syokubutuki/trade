"use client";

import { Trade } from "../lib/types";

interface Props {
  trades: Trade[];
  currency: string;
  initialCash: number;
}

export default function TradeHistory({ trades, currency, initialCash }: Props) {
  if (trades.length === 0) return null;

  const prefix = currency === "JPY" ? "¥" : "$";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="font-bold text-lg mb-3">
        売買履歴 <span className="text-gray-400 text-sm font-normal">({trades.length}回)</span>
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {trades.map((t, i) => {
          const pnl = t.totalValue - initialCash;
          return (
            <div
              key={i}
              className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    t.action === "buy"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {t.action === "buy" ? "買" : "売"}
                </span>
                <span className="text-gray-500">{t.date}</span>
              </div>
              <div className="text-right">
                <span className="font-medium">
                  {prefix}
                  {Math.round(t.price).toLocaleString()} x {t.shares}
                </span>
                <span
                  className={`ml-2 text-xs ${
                    pnl >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  ({pnl >= 0 ? "+" : ""}
                  {prefix}
                  {Math.abs(Math.round(pnl)).toLocaleString()})
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
