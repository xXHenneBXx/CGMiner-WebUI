import React, { useState } from "react";

export default function SettingsPage({ refreshRate, setRefreshRate, theme, setTheme }) {
  const [rate, setRate] = useState(refreshRate);
  const [autoRecover, setAutoRecover] = useState(() => localStorage.getItem("autoRecover") === "1");
  const [presets] = useState([500,550,600,650]);

  function save() {
    setRefreshRate(Number(rate));
    localStorage.setItem("autoRecover", autoRecover ? "1":"0");
    alert("Settings saved");
  }

  return (
    <div className="page settings-page">
      <h2>Settings</h2>
      <div className="card">
        <label>Refresh rate (ms)</label>
        <input type="number" value={rate} onChange={(e)=>setRate(e.target.value)} />
        <label>Theme</label>
        <select value={theme} onChange={(e)=>setTheme(e.target.value)}>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>

        <div>
          <label><input type="checkbox" checked={autoRecover} onChange={(e)=>setAutoRecover(e.target.checked)} /> Auto-reset miners when NoDevice</label>
        </div>

        <div style={{marginTop:8}}>
          <div>Freq presets</div>
          {presets.map(p => <button key={p} className="btn small" onClick={()=>{ navigator.clipboard?.writeText(String(p)); alert(`Preset ${p} copied to clipboard`); }}>{p} MHz</button>)}
        </div>

        <div style={{marginTop:8}}>
          <button className="btn" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
