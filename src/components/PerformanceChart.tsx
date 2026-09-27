"use client";

import { useMemo, useState } from "react";
import {
  formatMoneyShort,
  performanceChart,
  type ChartPeriod,
} from "@/lib/data";

const PERIODS: ChartPeriod[] = ["7D", "30D", "3M", "1Y"];

const SERIES = [
  { key: "revenue" as const, label: "Revenue", color: "var(--teal-deep)" },
  { key: "profit" as const, label: "Profit", color: "var(--ok)" },
  { key: "expenses" as const, label: "Expenses", color: "var(--sand-deep)" },
];

const CHART = { width: 640, height: 220, padX: 36, padY: 24 };

function buildPath(values: number[], max: number, count: number): string {
  const { width, height, padX, padY } = CHART;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const step = count > 1 ? innerW / (count - 1) : 0;

  return values
    .map((v, i) => {
      const x = padX + i * step;
      const y = padY + innerH - (v / max) * innerH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function yTicks(max: number): number[] {
  const step = max / 4;
  return [0, step, step * 2, step * 3, max];
}

export function PerformanceChart() {
  const [period, setPeriod] = useState<ChartPeriod>("7D");
  const points = performanceChart[period];

  const { max, paths, ticks } = useMemo(() => {
    const peak = Math.max(...points.flatMap((p) => [p.revenue, p.profit, p.expenses]));
    const maxVal = peak * 1.08;
    const paths = SERIES.map((s) => ({
      ...s,
      d: buildPath(
        points.map((p) => p[s.key]),
        maxVal,
        points.length,
      ),
    }));
    return { max: maxVal, paths, ticks: yTicks(maxVal) };
  }, [points]);

  return (
    <section className="panel performance-chart">
      <div className="performance-chart-head">
        <div>
          <h2>Business performance</h2>
          <p className="panel-lead">Revenue, expenses, and profit over the selected period.</p>
        </div>
        <div className="period-toggle" role="tablist" aria-label="Chart period">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={period === p}
              className={period === p ? "active" : undefined}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-legend">
        {SERIES.map((s) => (
          <span key={s.key} className="chart-legend-item">
            <i style={{ background: s.color }} aria-hidden="true" />
            {s.label}
          </span>
        ))}
      </div>

      <div className="chart-wrap">
        <svg
          viewBox={`0 0 ${CHART.width} ${CHART.height}`}
          className="performance-svg"
          role="img"
          aria-label={`Business performance chart for ${period}`}
        >
          {ticks.map((tick) => {
            const y = CHART.padY + (CHART.height - CHART.padY * 2) * (1 - tick / max);
            return (
              <g key={tick}>
                <line
                  x1={CHART.padX}
                  x2={CHART.width - CHART.padX}
                  y1={y}
                  y2={y}
                  className="chart-grid-line"
                />
                <text x={CHART.padX - 6} y={y + 4} textAnchor="end" className="chart-axis-label">
                  {formatMoneyShort(tick)}
                </text>
              </g>
            );
          })}

          {paths.map((s) => (
            <path key={s.key} d={s.d} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" />
          ))}

          {points.map((p, i) => {
            const innerW = CHART.width - CHART.padX * 2;
            const step = points.length > 1 ? innerW / (points.length - 1) : 0;
            const x = CHART.padX + i * step;
            return (
              <text key={p.label} x={x} y={CHART.height - 4} textAnchor="middle" className="chart-x-label">
                {p.label}
              </text>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
