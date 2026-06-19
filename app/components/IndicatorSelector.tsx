"use client";

import { IndicatorType, INDICATOR_LIST } from "../lib/indicators";

interface Props {
  active: Set<IndicatorType>;
  onToggle: (id: IndicatorType) => void;
}

const groupColors: Record<string, string> = {
  "移動平均": "bg-blue-50 border-blue-200",
  "オシレーター": "bg-amber-50 border-amber-200",
  "バンド": "bg-purple-50 border-purple-200",
};

const activeColors: Record<string, string> = {
  "移動平均": "bg-blue-600 text-white",
  "オシレーター": "bg-amber-600 text-white",
  "バンド": "bg-purple-600 text-white",
};

export default function IndicatorSelector({ active, onToggle }: Props) {
  const groups = Array.from(new Set(INDICATOR_LIST.map((i) => i.group)));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">テクニカル指標</h3>
      <div className="space-y-2">
        {groups.map((group) => (
          <div key={group}>
            <span className="text-xs text-gray-500">{group}</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {INDICATOR_LIST.filter((i) => i.group === group).map((ind) => {
                const isActive = active.has(ind.id);
                return (
                  <button
                    key={ind.id}
                    onClick={() => onToggle(ind.id)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      isActive
                        ? activeColors[group]
                        : `${groupColors[group]} text-gray-700 hover:opacity-80`
                    }`}
                  >
                    {ind.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
