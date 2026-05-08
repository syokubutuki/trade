"use client";

import { ComparisonResult } from "../lib/types";
import { formatCurrency, formatPercent } from "../lib/format";

interface Props {
  comparison: ComparisonResult;
  currency: string;
  hasTrades: boolean;
}

export default function ComparisonDisplay({
  comparison,
  currency,
  hasTrades,
}: Props) {
  if (!hasTrades) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 text-center text-gray-400 text-sm">
        売買を行うとBuy &amp; Holdとの比較が表示されます
      </div>
    );
  }

  const isWorse = comparison.difference < 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <h3 className="font-bold text-lg">リターン比較</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-xs text-blue-600 mb-1">Buy &amp; Hold (放置)</div>
          <div
            className={`text-2xl font-bold ${
              comparison.buyAndHoldReturn >= 0
                ? "text-blue-700"
                : "text-red-600"
            }`}
          >
            {formatPercent(comparison.buyAndHoldPercent)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatCurrency(comparison.buyAndHoldReturn, currency)}
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-xs text-orange-600 mb-1">あなたのトレード</div>
          <div
            className={`text-2xl font-bold ${
              comparison.humanReturn >= 0 ? "text-orange-700" : "text-red-600"
            }`}
          >
            {formatPercent(comparison.humanPercent)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatCurrency(comparison.humanReturn, currency)}
          </div>
        </div>
      </div>

      <div
        className={`rounded-lg p-4 text-center ${
          isWorse ? "bg-red-50" : "bg-green-50"
        }`}
      >
        <div className={`text-xs ${isWorse ? "text-red-600" : "text-green-600"} mb-1`}>
          {isWorse ? "放置していた方が良かった..." : "Buy & Holdに勝利!"}
        </div>
        <div
          className={`text-3xl font-black ${
            isWorse ? "text-red-600" : "text-green-600"
          }`}
        >
          {formatPercent(comparison.differencePercent)}
        </div>
        <div
          className={`text-sm mt-1 ${isWorse ? "text-red-500" : "text-green-500"}`}
        >
          {formatCurrency(comparison.difference, currency)}
        </div>
        {isWorse && (
          <p className="text-xs text-red-400 mt-2">
            何もせずに放置していれば、あなたはもっと儲かっていました
          </p>
        )}
      </div>
    </div>
  );
}
