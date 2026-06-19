import { PricePoint } from "./types";

export interface IndicatorData {
  time: string;
  value: number;
}

export interface MACDData {
  time: string;
  macd: number;
  signal: number;
  histogram: number;
}

export interface BollingerData {
  time: string;
  upper: number;
  middle: number;
  lower: number;
}

export type IndicatorType =
  | "sma5"
  | "sma25"
  | "sma75"
  | "ema12"
  | "ema26"
  | "rsi"
  | "macd"
  | "bollinger";

export interface IndicatorConfig {
  id: IndicatorType;
  label: string;
  group: "移動平均" | "オシレーター" | "バンド";
}

export const INDICATOR_LIST: IndicatorConfig[] = [
  { id: "sma5", label: "SMA(5)", group: "移動平均" },
  { id: "sma25", label: "SMA(25)", group: "移動平均" },
  { id: "sma75", label: "SMA(75)", group: "移動平均" },
  { id: "ema12", label: "EMA(12)", group: "移動平均" },
  { id: "ema26", label: "EMA(26)", group: "移動平均" },
  { id: "rsi", label: "RSI(14)", group: "オシレーター" },
  { id: "macd", label: "MACD", group: "オシレーター" },
  { id: "bollinger", label: "ボリンジャーバンド", group: "バンド" },
];

function sma(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += closes[j];
      result.push(sum / period);
    }
  }
  return result;
}

function ema(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += closes[j];
      result.push(sum / period);
    } else {
      result.push(closes[i] * k + (result[i - 1] as number) * (1 - k));
    }
  }
  return result;
}

export function calcSMA(
  prices: PricePoint[],
  period: number
): IndicatorData[] {
  const closes = prices.map((p) => p.close);
  const values = sma(closes, period);
  return prices
    .map((p, i) =>
      values[i] != null ? { time: p.time, value: values[i] as number } : null
    )
    .filter((v): v is IndicatorData => v !== null);
}

export function calcEMA(
  prices: PricePoint[],
  period: number
): IndicatorData[] {
  const closes = prices.map((p) => p.close);
  const values = ema(closes, period);
  return prices
    .map((p, i) =>
      values[i] != null ? { time: p.time, value: values[i] as number } : null
    )
    .filter((v): v is IndicatorData => v !== null);
}

export function calcRSI(
  prices: PricePoint[],
  period: number = 14
): IndicatorData[] {
  const closes = prices.map((p) => p.close);
  const result: IndicatorData[] = [];

  if (closes.length < period + 1) return result;

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push({
    time: prices[period].time,
    value: 100 - 100 / (1 + rs),
  });

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    result.push({ time: prices[i].time, value: rsi });
  }

  return result;
}

export function calcMACD(
  prices: PricePoint[],
  fast: number = 12,
  slow: number = 26,
  signal: number = 9
): MACDData[] {
  const closes = prices.map((p) => p.close);
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);

  const macdLine: (number | null)[] = closes.map((_, i) =>
    emaFast[i] != null && emaSlow[i] != null
      ? (emaFast[i] as number) - (emaSlow[i] as number)
      : null
  );

  // Signal line: EMA of MACD line
  const macdValues = macdLine.filter((v): v is number => v !== null);
  const signalLine = ema(macdValues, signal);

  const result: MACDData[] = [];
  let macdIdx = 0;
  for (let i = 0; i < closes.length; i++) {
    if (macdLine[i] == null) continue;
    if (signalLine[macdIdx] != null) {
      result.push({
        time: prices[i].time,
        macd: macdLine[i] as number,
        signal: signalLine[macdIdx] as number,
        histogram:
          (macdLine[i] as number) - (signalLine[macdIdx] as number),
      });
    }
    macdIdx++;
  }

  return result;
}

export function calcBollinger(
  prices: PricePoint[],
  period: number = 20,
  multiplier: number = 2
): BollingerData[] {
  const closes = prices.map((p) => p.close);
  const middle = sma(closes, period);
  const result: BollingerData[] = [];

  for (let i = period - 1; i < closes.length; i++) {
    if (middle[i] == null) continue;
    let sumSqDiff = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumSqDiff += (closes[j] - (middle[i] as number)) ** 2;
    }
    const stdDev = Math.sqrt(sumSqDiff / period);
    result.push({
      time: prices[i].time,
      upper: (middle[i] as number) + multiplier * stdDev,
      middle: middle[i] as number,
      lower: (middle[i] as number) - multiplier * stdDev,
    });
  }

  return result;
}
