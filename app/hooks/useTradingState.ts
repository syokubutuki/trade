"use client";

import { useReducer, useCallback } from "react";
import { TradingState, TradingAction } from "../lib/types";
import { executeBuy, executeSell } from "../lib/trading-engine";

const INITIAL_CASH = 1_000_000;

function tradingReducer(
  state: TradingState,
  action: TradingAction
): TradingState {
  switch (action.type) {
    case "BUY":
      return executeBuy(state, action.price, action.date);
    case "SELL":
      return executeSell(state, action.price, action.date);
    case "RESET":
      return {
        cash: action.initialCash,
        shares: 0,
        trades: [],
        initialCash: action.initialCash,
      };
    default:
      return state;
  }
}

const initialState: TradingState = {
  cash: INITIAL_CASH,
  shares: 0,
  trades: [],
  initialCash: INITIAL_CASH,
};

export function useTradingState() {
  const [state, dispatch] = useReducer(tradingReducer, initialState);

  const buy = useCallback((price: number, date: string) => {
    dispatch({ type: "BUY", price, date });
  }, []);

  const sell = useCallback((price: number, date: string) => {
    dispatch({ type: "SELL", price, date });
  }, []);

  const reset = useCallback((initialCash: number = INITIAL_CASH) => {
    dispatch({ type: "RESET", initialCash });
  }, []);

  return { state, buy, sell, reset };
}
