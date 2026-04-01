"use client";

import React, { useState } from "react";
import { TrendingUp } from "lucide-react";
import type { TrendDataPoint } from "@/lib/types";

type TrendChartProps = {
  data: TrendDataPoint[];
};

const formatCurrency = (v: number) =>
  v.toLocaleString("es-EC", { style: "currency", currency: "USD" });

export default function TrendChart({ data }: TrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [metric, setMetric] = useState<"deliveries" | "revenue">("deliveries");

  if (data.length === 0) {
    return (
      <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/30">
        <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          Tendencia (6 meses)
        </h3>
        <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant/40">
          <TrendingUp className="w-10 h-10 mb-2" />
          <p className="text-sm font-bold">Sin datos históricos</p>
          <p className="text-xs font-medium mt-1">
            La tendencia se generará con las entregas registradas.
          </p>
        </div>
      </div>
    );
  }

  const values = data.map((d) => (metric === "deliveries" ? d.deliveries : d.revenue));
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values);

  // SVG dimensions
  const W = 600;
  const H = 200;
  const PX = 40; // padding X
  const PY = 20; // padding Y
  const graphW = W - PX * 2;
  const graphH = H - PY * 2;

  const points = values.map((v, i) => ({
    x: PX + (i / Math.max(data.length - 1, 1)) * graphW,
    y: PY + graphH - ((v - minVal) / (maxVal - minVal || 1)) * graphH,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${
    PY + graphH
  } L ${PX} ${PY + graphH} Z`;

  // Simple forecast (average of last 2 points projected)
  let forecastPoint = null;
  if (points.length >= 2) {
    const last = values[values.length - 1];
    const prev = values[values.length - 2];
    const trend = last - prev;
    const forecastVal = Math.max(last + trend, 0);
    forecastPoint = {
      x: PX + (data.length / Math.max(data.length - 1, 1)) * graphW,
      y:
        PY +
        graphH -
        ((forecastVal - minVal) / (maxVal - minVal || 1)) * graphH,
      value: forecastVal,
    };
  }

  return (
    <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Tendencia (6 meses)
        </h3>
        <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1 border border-outline-variant/30">
          <button
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              metric === "deliveries"
                ? "bg-primary text-white shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
            onClick={() => setMetric("deliveries")}
          >
            Ventas
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              metric === "revenue"
                ? "bg-primary text-white shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
            onClick={() => setMetric("revenue")}
          >
            Ingresos
          </button>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${forecastPoint ? forecastPoint.x + 20 : W} ${H}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = PY + graphH * (1 - pct);
            return (
              <line
                key={pct}
                x1={PX}
                y1={y}
                x2={forecastPoint ? forecastPoint.x : PX + graphW}
                y2={y}
                stroke="var(--color-outline-variant)"
                strokeOpacity={0.2}
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Area fill */}
          <path
            d={areaD}
            fill="url(#areaGrad)"
            opacity={0.3}
          />

          {/* Gradient def */}
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Main line */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Forecast dashed line */}
          {forecastPoint && points.length > 0 && (
            <line
              x1={points[points.length - 1].x}
              y1={points[points.length - 1].y}
              x2={forecastPoint.x}
              y2={forecastPoint.y}
              stroke="var(--color-primary)"
              strokeWidth={2}
              strokeDasharray="6 4"
              strokeOpacity={0.4}
            />
          )}

          {/* Forecast point */}
          {forecastPoint && (
            <circle
              cx={forecastPoint.x}
              cy={forecastPoint.y}
              r={4}
              fill="var(--color-primary)"
              fillOpacity={0.3}
              stroke="var(--color-primary)"
              strokeWidth={1.5}
              strokeDasharray="3 2"
            />
          )}

          {/* Data points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 7 : 5}
                fill="var(--color-surface-container-lowest)"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              {/* Month labels */}
              <text
                x={p.x}
                y={H - 2}
                textAnchor="middle"
                fill="var(--color-on-surface-variant)"
                fontSize={9}
                fontWeight={700}
                className="uppercase"
              >
                {data[i].label.slice(0, 3)}
              </text>
            </g>
          ))}

          {/* Tooltip */}
          {hoveredIndex !== null && (
            <g>
              <rect
                x={points[hoveredIndex].x - 40}
                y={points[hoveredIndex].y - 36}
                width={80}
                height={24}
                rx={8}
                fill="var(--color-on-surface)"
                fillOpacity={0.9}
              />
              <text
                x={points[hoveredIndex].x}
                y={points[hoveredIndex].y - 20}
                textAnchor="middle"
                fill="var(--color-surface)"
                fontSize={10}
                fontWeight={800}
              >
                {metric === "revenue"
                  ? formatCurrency(values[hoveredIndex])
                  : `${values[hoveredIndex]} uds`}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Forecast legend */}
      {forecastPoint && (
        <div className="flex items-center gap-2 mt-3 text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
          <div className="w-4 border-t-2 border-dashed border-primary/40" />
          <span>
            Proyección:{" "}
            {metric === "revenue"
              ? formatCurrency(forecastPoint.value)
              : `${Math.round(forecastPoint.value)} uds`}
          </span>
        </div>
      )}
    </div>
  );
}
