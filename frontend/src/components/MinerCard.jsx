import React from "react";
import { Link } from "react-router-dom";

function formatHashrate(h) {
  if (!h) return "—";
  if (h > 1e9) return (h/1e9).toFixed(2) + " GH/s";
  if (h > 1e6) return (h/1e6).toFixed(2) + " MH/s";
  return h + " H/s";
}

export default function MinerCard({ host, asic, index }) {
  return (
    <div className="card miner-card">
      <div className="miner-header">
        <div>
          <div className="miner-title">ASIC {asic.id ?? index}</div>
          <div className="miner-sub">{asic.serial ?? "serial N/A"} • {host}</div>
        </div>
        <div className="miner-stats">
          <div className="hash">{formatHashrate(asic.hashrate)}</div>
          <div className="freq">{asic.freq} MHz</div>
        </div>
      </div>

      <div className="miner-body">
        <div className="stat-row"><strong>Accepted:</strong> {asic.accepted}</div>
        <div className="stat-row"><strong>Rejected:</strong> {asic.rejected}</div>
        <div className="stat-row"><strong>Chips:</strong> {asic.chips}</div>
        <div className="stat-row"><strong>Uptime:</strong> {Math.floor((asic.uptime||0)/60)}m</div>
      </div>

      <div className="card-actions">
        <button className="btn" onClick={async()=>{ await fetch(`http://localhost:8080/asic/${asic.id}/reset`, {method:'POST'}); }}>Reset</button>
        <button className="btn" onClick={async()=>{ await fetch(`http://localhost:8080/asic/${asic.id}/lock`, {method:'POST'}); }}>Lock</button>
        <button className="btn ghost" onClick={async()=>{ await fetch(`http://localhost:8080/asic/${asic.id}/unlock`, {method:'POST'}); }}>Unlock</button>
        <Link className="btn link" to={`/miner/${encodeURIComponent(host)}/${encodeURIComponent(asic.id ?? index)}`}>Details</Link>
      </div>
    </div>
  );
}
