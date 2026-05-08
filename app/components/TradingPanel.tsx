"use client";

import { TradingState } from "../lib/types";
import { formatCurrency } from "../lib/format";

interface Props {
  state: TradingState;
  selectedDate: string | null;
  selectedPrice: number | null;
  currency: string;
  onBuy: () => void;
  onSell: () => void;
  onReset: () => void;
  lastPrice: number | null;
}

export default function TradingPanel({
  state,
  selectedDate,
  selectedPrice,
  currency,
  onBuy,
  onSell,
  onReset,
  lastPrice,
}: Props) {
  const currentPrice = selectedPrice ?? lastPrice ?? 0;
  const totalValue = state.cash + state.shares * currentPrice;
  const canBuy = selectedDate && selectedPrice && state.cash >= (selectedPrice ?? 0);
  const canSell = selectedDate && selectedPrice && state.shares > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">売買パネル</h3>
        <button
          onClick={onReset}
          className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 rounded px-2 py-1"
        >
          リセット
        </button>
      </div>

      {selectedDate ? (
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <span className="text-gray-500">選択中: </span>
          <span className="font-medium">{selectedDate}</span>
          <span className="ml-2 font-bold">
            {currency === "JPY" ? "¥" : "$"}
            {selectedPrice?.toLocaleString()}
          </span>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-400">
          チャートをクリックして日付を選択してください
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onBuy}
          disabled={!canBuy}
          className="py-3 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          買い
        </button>
        <button
          onClick={onSell}
          disabled={!canSell}
          className="py-3 bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          売り
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">現金</span>
          <span className="font-medium">
            {currency === "JPY" ? "¥" : "$"}
            {Math.round(state.cash).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">保有株数</span>
          <span className="font-medium">{state.shares.toLocaleString()} 株</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">評価額</span>
          <span className="font-medium">
            {currency === "JPY" ? "¥" : "$"}
            {Math.round(state.shares * currentPrice).toLocaleString()}
          </span>
        </div>
        <hr />
        <div className="flex justify-between font-bold">
          <span>合計資産</span>
          <span>
            {currency === "JPY" ? "¥" : "$"}
            {Math.round(totalValue).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">損益</span>
          <span
            className={`font-bold ${
              totalValue - state.initialCash >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {formatCurrency(totalValue - state.initialCash, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
