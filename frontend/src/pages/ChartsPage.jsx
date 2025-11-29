import React from "react";
import ChartsPanel from "../components/ChartsPanel";

export default function ChartsPage({ data }) {
  return (
    <div className="page charts-page">
      <h2>Charts</h2>
      <ChartsPanel data={data} />
      <div style={{ marginTop: 12 }}>
        <p>Realtime updates come from backend WebSocket + periodic polling.</p>
      </div>
    </div>
  );
}
