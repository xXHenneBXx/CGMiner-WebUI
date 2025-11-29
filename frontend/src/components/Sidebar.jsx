import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar({ hosts = [] }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <img alt="logo" src="" style={{width:36, height:36, marginRight:8, borderRadius:6, background:'#2b2b2b'}}/>
        <div>
          <div className="brand-title">CompacF UI</div>
          <div className="brand-sub">Multi-hub dashboard</div>
        </div>
      </div>

      <nav className="nav">
        <NavLink to="/" end className={({isActive})=> isActive ? 'nav-item active':'nav-item'}>Overview</NavLink>
        <NavLink to="/charts" className={({isActive})=> isActive ? 'nav-item active':'nav-item'}>Charts</NavLink>
        <NavLink to="/settings" className={({isActive})=> isActive ? 'nav-item active':'nav-item'}>Settings</NavLink>

        <div className="host-list">
          <div className="host-list-title">Detected hosts</div>
          {hosts.length === 0 && <div className="host-empty">No hosts</div>}
          {hosts.map(h => <div key={h} className="host-item">{h}</div>)}
        </div>
      </nav>

      <div className="sidebar-footer">
        <small>v1 — Local only</small>
      </div>
    </aside>
  );
}
