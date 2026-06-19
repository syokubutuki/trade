"use client";

import { useMemo } from "react";
import { PricePoint, Trade } from "../lib/types";
import { deriveCriteria, CriterionStat } from "../lib/trade-criteria";

interface Props {
  prices: PricePoint[];
  trades: Trade[];
}

function fmt(v: number, unit: string): string {
  const abs = Math.abs(v);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  const s = v.toFixed(digits);
  return unit ? `${s}${unit}` : s;
}

// 全期間分布の中で平均値がどこに位置するかを示すバー
function DistributionBar({
  stat,
  accent,
}: {
  stat: CriterionStat;
  accent: string;
}) {
  const range = stat.fullMax - stat.fullMin;
  const toPct = (v: number) =>
    range > 0 ? ((v - stat.fullMin) / range) * 100 : 50;
  const meanPct = Math.max(0, Math.min(100, toPct(stat.mean)));
  const loPct = Math.max(0, Math.min(100, toPct(stat.mean - stat.std)));
  const hiPct = Math.max(0, Math.min(100, toPct(stat.mean + stat.std)));

  return (
    <div className="relative h-2 w-full rounded-full bg-gray-100">
      {/* ±1標準偏差の帯 */}
      <div
        className="absolute h-2 rounded-full opacity-30"
        style={{
          left: `${loPct}%`,
          width: `${Math.max(1, hiPct - loPct)}%`,
          backgroundColor: accent,
        }}
      />
      {/* 平均値マーカー */}
      <div
        className="absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded-full"
        style={{ left: `calc(${meanPct}% - 2px)`, backgroundColor: accent }}
      />
    </div>
  );
}

function interpret(stat: CriterionStat): string | null {
  if (stat.count < 2) return null;
  if (stat.percentile <= 20) return "全期間でも低め";
  if (stat.percentile >= 80) return "全期間でも高め";
  return null;
}

function CriteriaTable({
  title,
  stats,
  count,
  accent,
}: {
  title: string;
  stats: CriterionStat[];
  count: number;
  accent: string;
}) {
  return (
    <div className="flex-1 min-w-[280px]">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-semibold text-gray-800" style={{ color: accent }}>
          {title}
        </h3>
        <span className="text-xs text-gray-500">{count}回の取引から</span>
      </div>
      {count === 0 ? (
        <p className="text-sm text-gray-400 py-4">
          チャート上で{title.includes("買") ? "買い" : "売り"}を打つと基準が表示されます
        </p>
      ) : (
        <div className="space-y-2.5">
          {stats.map((s) => {
            const hint = interpret(s);
            return (
              <div key={s.id} className="text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-gray-600" title={s.description}>
                    {s.label}
                  </span>
                  <span className="font-mono font-medium text-gray-900">
                    {fmt(s.mean, s.unit)}
                    <span className="text-gray-400 font-normal">
                      {" "}
                      ±{fmt(s.std, "")}
                    </span>
                  </span>
                </div>
                <DistributionBar stat={s} accent={accent} />
                <div className="flex justify-between text-[11px] text-gray-400 mt-0.5">
                  <span>
                    範囲 {fmt(s.min, "")}〜{fmt(s.max, s.unit)}
                  </span>
                  <span>
                    {hint && <span style={{ color: accent }}>{hint} · </span>}
                    全期間中 {s.percentile.toFixed(0)}%地点
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TradeCriteria({ prices, trades }: Props) {
  const criteria = useMemo(
    () => deriveCriteria(prices, trades),
    [prices, trades]
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-3">
        <h2 className="font-bold text-gray-900">逆算した裁量トレードの基準</h2>
        <p className="text-xs text-gray-500 mt-1">
          ルールを決めるのではなく、あなたが実際に売買したタイミングから「どんな数値の局面で動いているか」を集計しています。
          点が多いほど基準が安定します。バーは全期間の分布の中での位置 (中央のマーカー=平均、帯=±標準偏差)。
        </p>
      </div>
      <div className="flex flex-wrap gap-x-8 gap-y-4">
        <CriteriaTable
          title="買いの基準"
          stats={criteria.buy}
          count={criteria.buyCount}
          accent="#16a34a"
        />
        <CriteriaTable
          title="売りの基準"
          stats={criteria.sell}
          count={criteria.sellCount}
          accent="#dc2626"
        />
      </div>
      <p className="text-[11px] text-gray-400 mt-3">
        ※ これは過去の売買傾向の「記述」であり、将来の利益を保証するものではありません。
      </p>
    </div>
  );
}
