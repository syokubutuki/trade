export interface PricePoint {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  date: string;
  action: "buy" | "sell";
  price: number;
  shares: number;
  cash: number;
  totalValue: number;
}

export interface TradingState {
  cash: number;
  shares: number;
  trades: Trade[];
  initialCash: number;
}

export interface ComparisonResult {
  buyAndHoldReturn: number;
  buyAndHoldPercent: number;
  humanReturn: number;
  humanPercent: number;
  difference: number;
  differencePercent: number;
}

export interface StockData {
  ticker: string;
  name: string;
  prices: PricePoint[];
  currency: string;
}

export type TradingAction =
  | { type: "BUY"; price: number; date: string }
  | { type: "SELL"; price: number; date: string }
  | { type: "RESET"; initialCash: number };
