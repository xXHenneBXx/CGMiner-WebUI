import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

/**
 * Shows details for a single ASIC. Allows direct frequency and chip control using backend.
 */
export default function MinerPage({ data }) {
  const { host, id } = useParams();
  const [asic, setAsic] = useState(null);
  const [freq, setFreq] = useState(550);

  useEffect(() => {
    const hostDecoded = decodeURIComponent(host);
    const hostStats = data[hostDecoded];
    if (hostStats) {
      const found = (hostStats.perAsic || []).find(a => String(a.id) === String(id));
      if (found) setAsic(found);
    }
  }, [data, host, id]);

  if (!asic) return <div className="card">Miner not found or no data yet.</div>;

  async function applyFreq() {
    await fetch(`http://localhost:8080/asic/${asic.id}/frequency`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ frequency: Number(freq), minerHost: host })
    });
    // no automatic refresh here — App will receive next poll/ws update
  }

  return (
    <div className="page miner-page">
      <div className="card">
        <h2>ASIC {asic.id} ({host})</h2>
        <div>Serial: {asic.serial}</div>
        <div>Hashrate: {(asic.hashrate/1e9).toFixed(2)} GH/s</div>
        <div>Accepted: {asic.accepted} • Rejected: {asic.rejected}</div>
      </div>

      <div className="card">
        <h3>Controls</h3>
        <label>Freq (MHz)</label>
        <input type="number" value={freq} onChange={(e)=>setFreq(e.target.value)} />
        <button className="btn" onClick={applyFreq}>Apply</button>
      </div>
    </div>
  );
}
