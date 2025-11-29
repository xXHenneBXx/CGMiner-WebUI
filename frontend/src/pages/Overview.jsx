import React from "react";
import MinerList from "../components/MinerList";
import ChartsPanel from "../components/ChartsPanel";

/**
 * data from App: { host: { totalHashrate, perAsic: [...] }, ...}
 */
export default function Overview({ data }) {
  // compute totals
  let totalHashrate = 0, accepted = 0, rejected = 0, chips = 0;
  Object.values(data).forEach(s => {
    if (!s || s.totalHashrate === undefined) return;
    totalHashrate += s.totalHashrate || 0;
    accepted += s.accepted || 0;
    rejected += s.rejected || 0;
    chips += s.chips || 0;
  });

  return (
    <div className="page overview">
      <div className="top-cards">
        <div className="card stat-card">
          <div className="stat-title">Total Hashrate</div>
          <div className="stat-value">{(totalHashrate/1e9).toFixed(2)} GH/s</div>
        </div>
        <div className="card stat-card">
          <div className="stat-title">Accepted</div>
          <div className="stat-value">{accepted}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-title">Rejected</div>
          <div className="stat-value">{rejected}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-title">Chips</div>
          <div className="stat-value">{chips}</div>
        </div>
      </div>

      <ChartsPanel data={data} />
      <h3 style={{marginTop:16}}>Miners</h3>
      <MinerList data={data} />
    </div>
  );
}
