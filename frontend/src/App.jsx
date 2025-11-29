import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Overview from "./pages/Overview";
import MinerPage from "./pages/MinerPage";
import ChartsPage from "./pages/ChartsPage";
import SettingsPage from "./pages/SettingsPage";
import useWebSocket from "./hooks/useWebSocket";

const API = (window.__BRIDGE_URL__ || "http://localhost:8080");

export default function App() {
  const [data, setData] = useState({}); // { host: normalizedStats }
  const [lastWsMessage, setLastWsMessage] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [refreshRate, setRefreshRate] = useState(() => Number(localStorage.getItem("refreshRate")) || 3000);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // REST poll
  useEffect(() => {
    let mounted = true;
    async function fetchStats() {
      try {
        const res = await fetch(`${API}/stats`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        if (!mounted) return;
        setData(j);
      } catch (e) {
        // keep last data, but store error in root object
        setData(prev => ({ ...prev, __error: e.message }));
      }
    }
    fetchStats();
    const id = setInterval(fetchStats, refreshRate);
    return () => { mounted = false; clearInterval(id); };
  }, [refreshRate]);

  // WebSocket
  useWebSocket(`${API.replace(/^http/, "ws")}/ws/logs`, (msg) => {
    try {
      const o = JSON.parse(msg);
      setLastWsMessage(o);
      if (o.type === "update" && o.miners) {
        // merge update into data
        setData(prev => ({ ...prev, ...o.miners }));
      }
    } catch (e) { /* ignore malformed */ }
  });

  return (
    <div className="app-root">
      <Sidebar
        hosts={Object.keys(data).filter(k => k !== "__error")}
        onAddHost={(host) => { /* optional manual add in future */ }}
      />
      <div className="main">
        <Header
          theme={theme}
          onToggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")}
          onOpenSettings={() => navigate("/settings")}
        />
        <div className="content">
          <Routes>
            <Route path="/" element={<Overview data={data} />} />
            <Route path="/miner/:host/:id" element={<MinerPage data={data} />} />
            <Route path="/charts" element={<ChartsPage data={data} />} />
            <Route path="/settings" element={<SettingsPage
              refreshRate={refreshRate}
              setRefreshRate={(v)=>{ setRefreshRate(v); localStorage.setItem("refreshRate", String(v)); }}
              theme={theme}
              setTheme={setTheme}
            />} />
            <Route path="*" element={<Overview data={data} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
