"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useStockData } from "./hooks/useStockData";
import { useTradingState } from "./hooks/useTradingState";
import {
  generateBuyAndHoldCurve,
  generateHumanCurve,
  calculateComparison,
} from "./lib/trading-engine";
import TickerInput from "./components/TickerInput";
import TradingPanel from "./components/TradingPanel";
import ComparisonDisplay from "./components/ComparisonDisplay";
import TradeHistory from "./components/TradeHistory";

const StockChart = dynamic(() => import("./components/StockChart"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400">
      チャート読み込み中...
    </div>
  ),
});

export default function Home() {
  const { data, loading, error, fetchStock } = useStockData();
  const { state, buy, sell, reset } = useTradingState();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);

  const prices = data?.prices ?? [];
  const currency = data?.currency ?? "JPY";

  const buyAndHoldCurve = useMemo(
    () => generateBuyAndHoldCurve(prices, state.initialCash),
    [prices, state.initialCash]
  );

  const humanCurve = useMemo(
    () => generateHumanCurve(prices, state.trades, state.initialCash),
    [prices, state.trades, state.initialCash]
  );

  const comparison = useMemo(
    () => calculateComparison(prices, state),
    [prices, state]
  );

  const lastPrice = prices.length > 0 ? prices[prices.length - 1].close : null;

  const handleFetch = useCallback(
    (ticker: string) => {
      reset();
      setSelectedDate(null);
      setSelectedPrice(null);
      fetchStock(ticker);
    },
    [fetchStock, reset]
  );

  const handleDateClick = useCallback((date: string, price: number) => {
    setSelectedDate(date);
    setSelectedPrice(price);
  }, []);

  const handleBuy = useCallback(() => {
    if (selectedDate && selectedPrice) {
      buy(selectedPrice, selectedDate);
    }
  }, [selectedDate, selectedPrice, buy]);

  const handleSell = useCallback(() => {
    if (selectedDate && selectedPrice) {
      sell(selectedPrice, selectedDate);
    }
  }, [selectedDate, selectedPrice, sell]);

  const handleReset = useCallback(() => {
    reset();
    setSelectedDate(null);
    setSelectedPrice(null);
  }, [reset]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">
            Buy &amp; Hold vs あなたのトレード
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            1年前に買って放置 vs 裁量トレード。頻繁な売買は本当に得なのか?
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <TickerInput
          onFetch={handleFetch}
          loading={loading}
          stockName={data?.name ?? null}
        />

        {error && (
          <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <StockChart
                prices={prices}
                trades={state.trades}
                buyAndHoldCurve={buyAndHoldCurve}
                humanCurve={humanCurve}
                selectedDate={selectedDate}
                onDateClick={handleDateClick}
              />
              <TradeHistory
                trades={state.trades}
                currency={currency}
                initialCash={state.initialCash}
              />
            </div>

            <div className="space-y-4">
              <TradingPanel
                state={state}
                selectedDate={selectedDate}
                selectedPrice={selectedPrice}
                currency={currency}
                onBuy={handleBuy}
                onSell={handleSell}
                onReset={handleReset}
                lastPrice={lastPrice}
              />
              <ComparisonDisplay
                comparison={comparison}
                currency={currency}
                hasTrades={state.trades.length > 0}
              />
            </div>
          </div>
        )}

        {!data && !loading && !error && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">銘柄コードを入力してデータを取得</p>
            <p className="text-sm">
              日本株: 4桁のコード (例: 9984, 8306) / 米国株: ティッカー (例: AAPL, MSFT)
            </p>
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-gray-400 py-8">
        株価データはYahoo Financeより取得。投資判断の参考としてご利用ください。
      </footer>
    </div>
  );
}
