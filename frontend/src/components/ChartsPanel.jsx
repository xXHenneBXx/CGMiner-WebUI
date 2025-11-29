import React, { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";

/**
 * Expects data: { host1: { perAsic: [...] }, ... }
 * This component builds a timeseries snapshot using the last-known snapshot per host/asic.
 * For a simple implementation we show current per-asic hashrates as points.
 */
export default function ChartsPanel({ data }) {
  const series = useMemo(() => {
    // build flat list of items per ASICS
    const rows = [];
    Object.entries(data).forEach(([host, stats]) => {
      if (!stats || !stats.perAsic) return;
      stats.perAsic.forEach((a) => {
        rows.push({ name: `${host}:${a.id}`, hashrate: a.hashrate || 0, accepted: a.accepted || 0 });
      });
    });
    return rows;
  }, [data]);

  return (
    <div className="card charts-card">
      <h3>Live Hashrates</h3>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={series}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line dataKey="hashrate" stroke="#00d1ff" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
