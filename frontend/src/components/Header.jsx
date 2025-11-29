import React from "react";
import { useNavigate } from "react-router-dom";

export default function Header({ theme, onToggleTheme, onOpenSettings }) {
  const nav = useNavigate();
  return (
    <header className="header">
      <div className="header-left">
        <button className="btn ghost" onClick={() => nav("/")}>Overview</button>
        <button className="btn ghost" onClick={() => nav("/charts")}>Charts</button>
      </div>

      <div className="header-right">
        <button className="btn" onClick={onToggleTheme}>{theme === "dark" ? "🌙 Dark" : "☀️ Light"}</button>
        <button className="btn" onClick={onOpenSettings}>Settings</button>
      </div>
    </header>
  );
}
