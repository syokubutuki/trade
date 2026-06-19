"use client";

import { useEffect, useRef, useMemo } from "react";
import {
  createChart,
  LineSeries,
  HistogramSeries,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
  type SeriesMarker,
  type ISeriesMarkersPluginApi,
} from "lightweight-charts";
import { PricePoint, Trade } from "../lib/types";
import {
  IndicatorType,
  calcSMA,
  calcEMA,
  calcRSI,
  calcMACD,
  calcBollinger,
} from "../lib/indicators";

interface Props {
  prices: PricePoint[];
  trades: Trade[];
  buyAndHoldCurve: { time: string; value: number }[];
  humanCurve: { time: string; value: number }[];
  selectedDate: string | null;
  onDateClick: (date: string, price: number) => void;
  activeIndicators: Set<IndicatorType>;
}

const INDICATOR_COLORS: Record<string, string> = {
  sma5: "#ef4444",
  sma25: "#22c55e",
  sma75: "#a855f7",
  ema12: "#06b6d4",
  ema26: "#ec4899",
  rsi: "#f59e0b",
  macd_line: "#2563eb",
  macd_signal: "#ef4444",
  macd_hist_pos: "rgba(34,197,94,0.6)",
  macd_hist_neg: "rgba(239,68,68,0.6)",
  bollinger_upper: "rgba(168,85,247,0.5)",
  bollinger_middle: "rgba(168,85,247,0.8)",
  bollinger_lower: "rgba(168,85,247,0.5)",
};

export default function StockChart({
  prices,
  trades,
  buyAndHoldCurve,
  humanCurve,
  selectedDate,
  onDateClick,
  activeIndicators,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);

  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);

  const priceSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bhSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const humanSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const selectionMarkersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(
    null
  );

  // Indicator series refs
  const indicatorSeriesRef = useRef<
    Map<string, ISeriesApi<"Line"> | ISeriesApi<"Histogram">>
  >(new Map());
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const rsiRefLinesRef = useRef<[ISeriesApi<"Line">, ISeriesApi<"Line">] | null>(null);
  const macdLineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdSignalRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdHistRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const onDateClickRef = useRef(onDateClick);
  useEffect(() => {
    onDateClickRef.current = onDateClick;
  }, [onDateClick]);

  const pricesRef = useRef(prices);
  useEffect(() => {
    pricesRef.current = prices;
  }, [prices]);

  const showRsi = activeIndicators.has("rsi");
  const showMacd = activeIndicators.has("macd");

  // Calculate indicators
  const indicatorData = useMemo(() => {
    if (prices.length === 0) return null;
    return {
      sma5: calcSMA(prices, 5),
      sma25: calcSMA(prices, 25),
      sma75: calcSMA(prices, 75),
      ema12: calcEMA(prices, 12),
      ema26: calcEMA(prices, 26),
      rsi: calcRSI(prices),
      macd: calcMACD(prices),
      bollinger: calcBollinger(prices),
    };
  }, [prices]);

  // Initialize main chart
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
      indicatorSeriesRef.current.clear();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // Initialize RSI sub-chart
  useEffect(() => {
    if (!showRsi) {
      if (rsiChartRef.current) {
        rsiChartRef.current.remove();
        rsiChartRef.current = null;
        rsiSeriesRef.current = null;
      }
      return;
    }
    if (!rsiContainerRef.current || rsiChartRef.current) return;

    const chart = createChart(rsiContainerRef.current, {
      layout: { background: { color: "#ffffff" }, textColor: "#333" },
      grid: { vertLines: { color: "#f0f0f0" }, horzLines: { color: "#f0f0f0" } },
      width: rsiContainerRef.current.clientWidth,
      height: 120,
      crosshair: { mode: 0 },
      rightPriceScale: { visible: true, scaleMargins: { top: 0.1, bottom: 0.1 } },
      leftPriceScale: { visible: false },
      timeScale: { timeVisible: false },
    });
    rsiChartRef.current = chart;

    const series = chart.addSeries(LineSeries, {
      color: INDICATOR_COLORS.rsi,
      lineWidth: 1,
      title: "RSI(14)",
      priceScaleId: "right",
    });
    rsiSeriesRef.current = series;

    // 70/30 reference lines stored in refs
    const rsi70 = chart.addSeries(LineSeries, {
      color: "rgba(239,68,68,0.3)",
      lineWidth: 1,
      lineStyle: 2,
      priceScaleId: "right",
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    const rsi30 = chart.addSeries(LineSeries, {
      color: "rgba(34,197,94,0.3)",
      lineWidth: 1,
      lineStyle: 2,
      priceScaleId: "right",
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    rsiRefLinesRef.current = [rsi70, rsi30];

    const handleResize = () => {
      if (rsiContainerRef.current) {
        chart.applyOptions({ width: rsiContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      rsiChartRef.current = null;
      rsiSeriesRef.current = null;
      rsiRefLinesRef.current = null;
    };
  }, [showRsi]);

  // Initialize MACD sub-chart
  useEffect(() => {
    if (!showMacd) {
      if (macdChartRef.current) {
        macdChartRef.current.remove();
        macdChartRef.current = null;
        macdLineRef.current = null;
        macdSignalRef.current = null;
        macdHistRef.current = null;
      }
      return;
    }
    if (!macdContainerRef.current || macdChartRef.current) return;

    const chart = createChart(macdContainerRef.current, {
      layout: { background: { color: "#ffffff" }, textColor: "#333" },
      grid: { vertLines: { color: "#f0f0f0" }, horzLines: { color: "#f0f0f0" } },
      width: macdContainerRef.current.clientWidth,
      height: 150,
      crosshair: { mode: 0 },
      rightPriceScale: { visible: true },
      leftPriceScale: { visible: false },
      timeScale: { timeVisible: false },
    });
    macdChartRef.current = chart;

    const hist = chart.addSeries(HistogramSeries, {
      title: "MACD Hist",
      priceScaleId: "right",
    });
    macdHistRef.current = hist;

    const macdLine = chart.addSeries(LineSeries, {
      color: INDICATOR_COLORS.macd_line,
      lineWidth: 1,
      title: "MACD",
      priceScaleId: "right",
    });
    macdLineRef.current = macdLine;

    const signalLine = chart.addSeries(LineSeries, {
      color: INDICATOR_COLORS.macd_signal,
      lineWidth: 1,
      title: "Signal",
      priceScaleId: "right",
    });
    macdSignalRef.current = signalLine;

    const handleResize = () => {
      if (macdContainerRef.current) {
        chart.applyOptions({ width: macdContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      macdChartRef.current = null;
      macdLineRef.current = null;
      macdSignalRef.current = null;
      macdHistRef.current = null;
    };
  }, [showMacd]);

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
        position:
          t.action === "buy" ? ("belowBar" as const) : ("aboveBar" as const),
        color: t.action === "buy" ? "#16a34a" : "#dc2626",
        shape:
          t.action === "buy" ? ("arrowUp" as const) : ("arrowDown" as const),
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

  // Update overlay indicators (SMA, EMA, Bollinger) on main chart
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !indicatorData) return;

    const overlayKeys = ["sma5", "sma25", "sma75", "ema12", "ema26"] as const;
    const existing = indicatorSeriesRef.current;

    // Add or remove overlay indicators
    for (const key of overlayKeys) {
      if (activeIndicators.has(key)) {
        if (!existing.has(key)) {
          const series = chart.addSeries(LineSeries, {
            color: INDICATOR_COLORS[key],
            lineWidth: 1,
            title: key.toUpperCase(),
            priceScaleId: "right",
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          });
          existing.set(key, series);
        }
        const series = existing.get(key) as ISeriesApi<"Line">;
        const data: LineData<Time>[] = indicatorData[key].map((d) => ({
          time: d.time as Time,
          value: d.value,
        }));
        series.setData(data);
      } else if (existing.has(key)) {
        chart.removeSeries(existing.get(key)!);
        existing.delete(key);
      }
    }

    // Bollinger Bands
    const bbKeys = ["bollinger_upper", "bollinger_middle", "bollinger_lower"] as const;
    if (activeIndicators.has("bollinger")) {
      const bb = indicatorData.bollinger;
      const seriesConfigs = [
        { key: "bollinger_upper" as const, getData: (d: (typeof bb)[number]) => d.upper },
        { key: "bollinger_middle" as const, getData: (d: (typeof bb)[number]) => d.middle },
        { key: "bollinger_lower" as const, getData: (d: (typeof bb)[number]) => d.lower },
      ];
      for (const { key, getData } of seriesConfigs) {
        if (!existing.has(key)) {
          const series = chart.addSeries(LineSeries, {
            color: INDICATOR_COLORS[key],
            lineWidth: 1,
            title: key === "bollinger_middle" ? "BB(20)" : "",
            priceScaleId: "right",
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          });
          existing.set(key, series);
        }
        const series = existing.get(key) as ISeriesApi<"Line">;
        const data: LineData<Time>[] = bb.map((d) => ({
          time: d.time as Time,
          value: getData(d),
        }));
        series.setData(data);
      }
    } else {
      for (const key of bbKeys) {
        if (existing.has(key)) {
          chart.removeSeries(existing.get(key)!);
          existing.delete(key);
        }
      }
    }
  }, [activeIndicators, indicatorData]);

  // Update RSI sub-chart data
  useEffect(() => {
    if (!rsiSeriesRef.current || !indicatorData || !rsiChartRef.current) return;
    const rsiData = indicatorData.rsi;
    const data: LineData<Time>[] = rsiData.map((d) => ({
      time: d.time as Time,
      value: d.value,
    }));
    rsiSeriesRef.current.setData(data);

    // 70/30 reference lines
    if (rsiData.length > 0 && rsiRefLinesRef.current) {
      const [line70, line30] = rsiRefLinesRef.current;
      const times = rsiData.map((d) => d.time as Time);
      line70.setData(times.map((t) => ({ time: t, value: 70 })));
      line30.setData(times.map((t) => ({ time: t, value: 30 })));
    }

    rsiChartRef.current.timeScale().fitContent();
  }, [indicatorData, showRsi]);

  // Update MACD sub-chart data
  useEffect(() => {
    if (
      !macdLineRef.current ||
      !macdSignalRef.current ||
      !macdHistRef.current ||
      !indicatorData
    )
      return;
    const macdData = indicatorData.macd;

    macdLineRef.current.setData(
      macdData.map((d) => ({ time: d.time as Time, value: d.macd }))
    );
    macdSignalRef.current.setData(
      macdData.map((d) => ({ time: d.time as Time, value: d.signal }))
    );
    macdHistRef.current.setData(
      macdData.map((d) => ({
        time: d.time as Time,
        value: d.histogram,
        color:
          d.histogram >= 0
            ? INDICATOR_COLORS.macd_hist_pos
            : INDICATOR_COLORS.macd_hist_neg,
      }))
    );

    macdChartRef.current?.timeScale().fitContent();
  }, [indicatorData, showMacd]);

  // Sync time scales
  useEffect(() => {
    const mainChart = chartRef.current;
    if (!mainChart) return;

    const subCharts = [rsiChartRef.current, macdChartRef.current].filter(
      Boolean
    ) as IChartApi[];

    if (subCharts.length === 0) return;

    const unsubscribes: (() => void)[] = [];

    const mainTimeScale = mainChart.timeScale();
    const handler = () => {
      const range = mainTimeScale.getVisibleLogicalRange();
      if (!range) return;
      for (const sub of subCharts) {
        sub.timeScale().setVisibleLogicalRange(range);
      }
    };
    mainTimeScale.subscribeVisibleLogicalRangeChange(handler);
    unsubscribes.push(() =>
      mainTimeScale.unsubscribeVisibleLogicalRangeChange(handler)
    );

    return () => {
      for (const unsub of unsubscribes) unsub();
    };
  }, [showRsi, showMacd]);

  return (
    <div className="w-full">
      <div className="flex gap-4 mb-2 text-sm flex-wrap">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-gray-700" /> 株価
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-blue-600" /> Buy &amp;
          Hold
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-orange-500" /> あなた
        </span>
        {activeIndicators.has("sma5") && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-red-500" /> SMA(5)
          </span>
        )}
        {activeIndicators.has("sma25") && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-green-500" /> SMA(25)
          </span>
        )}
        {activeIndicators.has("sma75") && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-purple-500" /> SMA(75)
          </span>
        )}
        {activeIndicators.has("ema12") && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-cyan-500" /> EMA(12)
          </span>
        )}
        {activeIndicators.has("ema26") && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-pink-500" /> EMA(26)
          </span>
        )}
        {activeIndicators.has("bollinger") && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-purple-400" /> BB(20)
          </span>
        )}
      </div>
      <div
        ref={containerRef}
        className="w-full rounded-lg border border-gray-200"
      />
      {showRsi && (
        <div className="mt-1">
          <div className="text-xs text-gray-500 mb-1">RSI(14)</div>
          <div
            ref={rsiContainerRef}
            className="w-full rounded-lg border border-gray-200"
          />
        </div>
      )}
      {showMacd && (
        <div className="mt-1">
          <div className="text-xs text-gray-500 mb-1">MACD(12,26,9)</div>
          <div
            ref={macdContainerRef}
            className="w-full rounded-lg border border-gray-200"
          />
        </div>
      )}
      <p className="text-xs text-gray-400 mt-1">
        チャートをクリックして日付を選択 → 売買ボタンで取引
      </p>
    </div>
  );
}
