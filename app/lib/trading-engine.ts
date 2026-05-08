import { PricePoint, Trade, TradingState, ComparisonResult } from "./types";

export function executeBuy(
  state: TradingState,
  price: number,
  date: string
): TradingState {
  if (state.cash <= 0 || price <= 0) return state;
  const shares = Math.floor(state.cash / price);
  if (shares === 0) return state;
  const cost = shares * price;
  const newCash = state.cash - cost;
  const totalValue = newCash + (state.shares + shares) * price;
  const trade: Trade = {
    date,
    action: "buy",
    price,
    shares,
    cash: newCash,
    totalValue,
  };
  return {
    ...state,
    cash: newCash,
    shares: state.shares + shares,
    trades: [...state.trades, trade],
  };
}

export function executeSell(
  state: TradingState,
  price: number,
  date: string
): TradingState {
  if (state.shares <= 0 || price <= 0) return state;
  const proceeds = state.shares * price;
  const newCash = state.cash + proceeds;
  const trade: Trade = {
    date,
    action: "sell",
    price,
    shares: state.shares,
    cash: newCash,
    totalValue: newCash,
  };
  return {
    ...state,
    cash: newCash,
    shares: 0,
    trades: [...state.trades, trade],
  };
}

export function generateBuyAndHoldCurve(
  prices: PricePoint[],
  initialCash: number
): { time: string; value: number }[] {
  if (prices.length === 0) return [];
  const firstPrice = prices[0].close;
  const shares = initialCash / firstPrice;
  return prices.map((p) => ({
    time: p.time,
    value: shares * p.close,
  }));
}

export function generateHumanCurve(
  prices: PricePoint[],
  trades: Trade[],
  initialCash: number
): { time: string; value: number }[] {
  if (prices.length === 0) return [];

  let cash = initialCash;
  let shares = 0;
  let tradeIndex = 0;

  return prices.map((p) => {
    while (tradeIndex < trades.length && trades[tradeIndex].date === p.time) {
      const t = trades[tradeIndex];
      if (t.action === "buy") {
        const bought = Math.floor(cash / t.price);
        cash -= bought * t.price;
        shares += bought;
      } else {
        cash += shares * t.price;
        shares = 0;
      }
      tradeIndex++;
    }
    return {
      time: p.time,
      value: cash + shares * p.close,
    };
  });
}

export function calculateComparison(
  prices: PricePoint[],
  state: TradingState
): ComparisonResult {
  if (prices.length === 0) {
    return {
      buyAndHoldReturn: 0,
      buyAndHoldPercent: 0,
      humanReturn: 0,
      humanPercent: 0,
      difference: 0,
      differencePercent: 0,
    };
  }

  const lastPrice = prices[prices.length - 1].close;
  const firstPrice = prices[0].close;

  const buyAndHoldValue = (state.initialCash / firstPrice) * lastPrice;
  const buyAndHoldReturn = buyAndHoldValue - state.initialCash;
  const buyAndHoldPercent = (buyAndHoldReturn / state.initialCash) * 100;

  const humanValue = state.cash + state.shares * lastPrice;
  const humanReturn = humanValue - state.initialCash;
  const humanPercent = (humanReturn / state.initialCash) * 100;

  const difference = humanReturn - buyAndHoldReturn;
  const differencePercent = humanPercent - buyAndHoldPercent;

  return {
    buyAndHoldReturn,
    buyAndHoldPercent,
    humanReturn,
    humanPercent,
    difference,
    differencePercent,
  };
}
