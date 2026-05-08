"use client";

import { useState, useCallback } from "react";
import { StockData } from "../lib/types";

export function useStockData() {
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStock = useCallback(async (ticker: string) => {
    if (!ticker.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(
        `/api/stock?ticker=${encodeURIComponent(ticker.trim())}`
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to fetch");
        return;
      }
      setData(json);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchStock };
}
