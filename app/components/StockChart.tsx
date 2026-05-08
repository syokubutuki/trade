"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  LineSeries,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
  type SeriesMarker,
  type ISeriesMarkersPluginApi,
} from "lightweight-charts";
import { PricePoint, Trade } from "../lib/types";

interface Props {
  prices: PricePoint[];
  trades: Trade[];
  buyAndHoldCurve: { time: string; value: number }[];
  humanCurve: { time: string; value: number }[];
  selectedDate: string | null;
  onDateClick: (date: string, price: number) => void;
}

export default function StockChart({
  prices,
  trades,
  buyAndHoldCurve,
  humanCurve,
  selectedDate,
  onDateClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bhSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const humanSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const selectionMarkersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

  const onDateClickRef = useRef(onDateClick);
  useEffect(() => {
    onDateClickRef.current = onDateClick;
  }, [onDateClick]);

  const pricesRef = useRef(prices);
  useEffect(() => {
    pricesRef.current = prices;
  }, [prices]);

  // Initialize chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "#ffffff" },
        textColor: "#333",
      },
      grid: {
        vertLines: { color: "#f0f0f0" },
        horzLines: { color: "#f0f0f0" },
      },
      width: containerRef.current.clientWidth,
      height: 400,
      crosshair: { mode: 0 },
      rightPriceScale: { visible: true },
      leftPriceScale: { visible: true },
      timeScale: { timeVisible: false },
    });

    chartRef.current = chart;

    const priceSeries = chart.addSeries(LineSeries, {
      color: "#333333",
      lineWidth: 2,
      title: "株価",
      priceScaleId: "right",
    });
    priceSeriesRef.current = priceSeries;

    const bhSeries = chart.addSeries(LineSeries, {
      color: "#2563eb",
      lineWidth: 2,
      title: "Buy & Hold",
      priceScaleId: "left",
    });
    bhSeriesRef.current = bhSeries;

    const humanSeries = chart.addSeries(LineSeries, {
      color: "#f97316",
      lineWidth: 2,
      title: "あなた",
      priceScaleId: "left",
    });
    humanSeriesRef.current = humanSeries;

    const markers = createSeriesMarkers(priceSeries, []);
    markersRef.current = markers;

    const selectionMarkers = createSeriesMarkers(priceSeries, []);
    selectionMarkersRef.current = selectionMarkers;

    chart.subscribeClick((param) => {
      if (!param.time) return;
      const timeStr = param.time as string;
      const point = pricesRef.current.find((p) => p.time === timeStr);
      if (point) {
        onDateClickRef.current(point.time, point.close);
      }
    });

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // Update price data + markers
  useEffect(() => {
    if (!priceSeriesRef.current || prices.length === 0) return;
    const data: LineData<Time>[] = prices.map((p) => ({
      time: p.time as Time,
      value: p.close,
    }));
    priceSeriesRef.current.setData(data);

    if (markersRef.current) {
      const markers: SeriesMarker<Time>[] = trades.map((t) => ({
        time: t.date as Time,
        position: t.action === "buy" ? ("belowBar" as const) : ("aboveBar" as const),
        color: t.action === "buy" ? "#16a34a" : "#dc2626",
        shape: t.action === "buy" ? ("arrowUp" as const) : ("arrowDown" as const),
        text: t.action === "buy" ? "買" : "売",
      }));
      markersRef.current.setMarkers(markers);
    }

    chartRef.current?.timeScale().fitContent();
  }, [prices, trades]);

  // Update selection marker
  useEffect(() => {
    if (!selectionMarkersRef.current) return;
    if (!selectedDate) {
      selectionMarkersRef.current.setMarkers([]);
      return;
    }
    const point = prices.find((p) => p.time === selectedDate);
    if (!point) {
      selectionMarkersRef.current.setMarkers([]);
      return;
    }
    selectionMarkersRef.current.setMarkers([
      {
        time: point.time as Time,
        position: "inBar" as const,
        color: "#6366f1",
        shape: "circle" as const,
        size: 2,
        text: selectedDate,
      },
    ]);
  }, [selectedDate, prices]);

  // Update Buy&Hold curve
  useEffect(() => {
    if (!bhSeriesRef.current) return;
    const data: LineData<Time>[] = buyAndHoldCurve.map((p) => ({
      time: p.time as Time,
      value: p.value,
    }));
    bhSeriesRef.current.setData(data);
  }, [buyAndHoldCurve]);

  // Update Human curve
  useEffect(() => {
    if (!humanSeriesRef.current) return;
    const data: LineData<Time>[] = humanCurve.map((p) => ({
      time: p.time as Time,
      value: p.value,
    }));
    humanSeriesRef.current.setData(data);
  }, [humanCurve]);

  return (
    <div className="w-full">
      <div className="flex gap-4 mb-2 text-sm">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-gray-700" /> 株価
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-blue-600" /> Buy &amp; Hold
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-orange-500" /> あなた
        </span>
      </div>
      <div ref={containerRef} className="w-full rounded-lg border border-gray-200" />
      <p className="text-xs text-gray-400 mt-1">
        チャートをクリックして日付を選択 → 売買ボタンで取引
      </p>
    </div>
  );
}
