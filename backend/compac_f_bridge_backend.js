/**
 * CompacF CGMiner Bridge (robust rewritten backend)
 * - Safe parsing of CGMiner output (tolerant to broken JSON)
 * - Aggregates all STATS entries into totals + perAsic list
 * - Multi-miner hosts via CGMINER_HOSTS env (comma-separated)
 * - Exposes REST endpoints and a WebSocket /ws/logs
 *
 * Node 18+ recommended
 *
 * Save as: backend/compac_f_bridge_backend.js
 */

import net from "net";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import os from "os";

/* Optional: load .env file if present (install dotenv and uncomment)
import 'dotenv/config';
*/

// Configuration (env overrides)
const HTTP_PORT = parseInt(process.env.HTTP_PORT || "8080", 10);
const CGMINER_PORT = parseInt(process.env.CGMINER_PORT || "4028", 10);
// One or more hosts (for most users with USB-hub this will be a single host)
const CGMINER_HOSTS = (process.env.CGMINER_HOSTS || "192.168.0.200").split(",").map(s => s.trim());

// Simple TTL cache
class Cache {
  constructor() { this.map = new Map(); }
  set(k, v, ttlMs=1500) { this.map.set(k, { v, e: Date.now()+ttlMs }); }
  get(k) { const it = this.map.get(k); if(!it) return null; if(Date.now() > it.e) { this.map.delete(k); return null; } return it.v; }
  del(k) { this.map.delete(k); }
}
const cache = new Cache();

// Safe parse helper: try JSON.parse, then attempt to extract JSON substring, else return raw
function safeParse(raw) {
  if (!raw || typeof raw !== "string") return raw;
  const trimmed = raw.trim();
  if (!trimmed) return raw;
  // Try direct parse
  try { return JSON.parse(trimmed); } catch(e) { /* fallthrough */ }

  // Find first { or [ and last } or ] and try to parse substring(s)
  const firstBrace = Math.min(
    ...["{","["].map(ch => {
      const i = trimmed.indexOf(ch);
      return i === -1 ? Infinity : i;
    })
  );
  const lastBrace = Math.max(
    ...["}","]"].map(ch => trimmed.lastIndexOf(ch))
  );
  if (firstBrace !== Infinity && lastBrace > firstBrace) {
    const jsonPart = trimmed.slice(firstBrace, lastBrace + 1);
    try { return JSON.parse(jsonPart); } catch(e) { /* ignore */ }
  }

  // As a last resort, try to replace single quotes with double (sometimes returned) — still risky
  try {
    const alt = trimmed.replace(/'/g,'"');
    return JSON.parse(alt);
  } catch(e) { /* ignore */ }

  // Give up: return raw safely
  return { raw: trimmed };
}

// Talk to CGMiner host (TCP). returns parsed object or { raw: '...' }
function sendToCgminer(host, command, parameter=undefined, timeoutMs=3000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let buf = "";
    let finished = false;

    const onDone = (res) => { if(!finished){ finished = true; socket.destroy(); resolve(res); } };
    const onError = (err) => { if(!finished){ finished = true; socket.destroy(); reject(err); } };

    socket.setTimeout(timeoutMs, () => onError(new Error("CGMiner socket timeout")));

    socket.connect(CGMINER_PORT, host, () => {
      const payload = parameter === undefined
        ? JSON.stringify({ command }) + "\n"
        : JSON.stringify({ command, parameter }) + "\n";
      socket.write(payload);
    });

    socket.on("data", chunk => { buf += chunk.toString(); });
    // Many CGMiner implementations close the socket after sending; also handle 'end'
    socket.on("end", () => {
      try {
        const parsed = safeParse(buf);
        onDone(parsed);
      } catch (e) {
        onDone({ raw: buf });
      }
    });

    socket.on("close", () => {
      if (!finished) {
        try { onDone(safeParse(buf)); } catch(e) { onDone({ raw: buf }); }
      }
    });

    socket.on("error", (err) => onError(err));
  });
}

// Cached wrapper per host/command/param
async function cached(host, command, parameter, ttl=1500) {
  const key = `${host}|${command}|${parameter||""}`;
  const c = cache.get(key);
  if (c) return c;
  try {
    const r = await sendToCgminer(host, command, parameter);
    cache.set(key, r, ttl);
    return r;
  } catch (e) {
    // return structured error rather than throwing to keep endpoints stable
    const errObj = { error: e?.message ?? String(e) };
    cache.set(key, errObj, Math.min(1000, ttl));
    return errObj;
  }
}

// Convert raw cgminer stats to clean dashboard object
function normalizeStats(raw) {
  // raw might be { raw: '...' } or parsed object
  if (!raw) return { totalHashrate: 0, uptime: 0, accepted: 0, rejected: 0, chips: 0, perAsic: [] };
  // If raw contains STATS array, use that; otherwise try other common shapes
  const statsArr = Array.isArray(raw.STATS) ? raw.STATS : (Array.isArray(raw) ? raw : (raw.STATS ? [].concat(raw.STATS) : null));
  if (!statsArr) {
    // attempt nested STATUS->STATS, fallback to returning raw
    return { raw };
  }

  // Helper to read hashrate fields defensively
  function readHash(dev) {
    return Number(dev.GHGHs ?? dev["GHS"] ?? dev["GHS av"] ?? dev["GHS_av"] ?? dev["MHS av"] ?? dev["MHS"] ?? dev.GH ?? 0) || 0;
  }

  const perAsic = statsArr.map(s => {
    return {
      id: s.ID ?? s.id ?? null,
      serial: s.Serial ?? s.serial ?? null,
      hashrate: readHash(s),
      lastHashrate: Number(s.GHLast ?? s["GHLast"] ?? 0) || 0,
      accepted: Number(s.Accepted ?? s.accepted ?? 0) || 0,
      rejected: Number(s.Rejected ?? s.rejected ?? 0) || 0,
      nonces: Number(s.Nonces ?? s.nonces ?? 0) || 0,
      chips: Number(s.Chips ?? s.chips ?? 0) || 0,
      freq: Number(s.Frequency ?? s.FreqSel ?? s.freq ?? 0) || 0,
      uptime: Number(s.Elapsed ?? s.Uptime ?? s.elapsed ?? 0) || 0,
      raw: s
    };
  });

  const totalHashrate = perAsic.reduce((a,b) => a + (b.hashrate || 0), 0);
  const uptime = perAsic.reduce((a,b) => Math.max(a, b.uptime || 0), 0);
  const accepted = perAsic.reduce((a,b) => a + (b.accepted || 0), 0);
  const rejected = perAsic.reduce((a,b) => a + (b.rejected || 0), 0);
  const chips = perAsic.reduce((a,b) => a + (b.chips || 0), 0);

  return {
    totalHashrate,
    uptime,
    accepted,
    rejected,
    chips,
    perAsic
  };
}

/* EXPRESS APP */
const app = express();
app.use(cors());
app.use(express.json());

// GET /stats -> aggregated across configured hosts (for your setup usually one host with many USB miners)
app.get("/stats", async (req,res) => {
  try {
    const out = {};
    for (const host of CGMINER_HOSTS) {
      const raw = await cached(host, "stats", undefined, 1500);
      out[host] = normalizeStats(raw);
    }
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e?.message ?? String(e) });
  }
});

// GET /devs -> raw devs for each host
app.get("/devs", async (req,res) => {
  try {
    const out = {};
    for (const host of CGMINER_HOSTS) {
      const r = await cached(host, "devs", undefined, 1500);
      out[host] = r.DEVS ?? r;
    }
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e?.message ?? String(e) });
  }
});

// GET /asic/:id -> forward asc/ascstats for first host by default (single cgminer instance scenario)
app.get("/asic/:id", async (req,res) => {
  const id = String(req.params.id);
  const host = CGMINER_HOSTS[0];
  try {
    let r = await cached(host, "asc", id, 1000);
    if (r && r.error) r = await cached(host, "ascstats", id, 1000);
    res.json(r);
  } catch (e) {
    res.status(500).json({ error: e?.message ?? String(e) });
  }
});

// POST /asic/:id/ascset -> send raw ascset parameter (parameter string expected)
app.post("/asic/:id/ascset", async (req,res) => {
  const id = req.params.id;
  const { parameter } = req.body || {};
  if (!parameter) return res.status(400).json({ error: "Missing parameter (string) in body" });
  const host = CGMINER_HOSTS[0];
  try {
    const paramStr = `${id},${parameter}`;
    const r = await sendToCgminer(host, "ascset", paramStr);
    cache.del(`${host}|stats|`);
    res.json(r);
  } catch (e) { res.status(500).json({ error: e?.message ?? String(e) }); }
});

// Convenience endpoints (frequency, chip, require, lock, unlock, usbprop, reset)
app.post("/asic/:id/frequency", async (req,res) => {
  const { frequency, minerHost } = req.body || {};
  if (typeof frequency !== "number") return res.status(400).json({ error: "frequency (number) required" });
  const host = minerHost || CGMINER_HOSTS[0];
  try {
    const r = await sendToCgminer(host, "ascset", `${req.params.id},freq,${frequency}`);
    cache.del(`${host}|stats|`);
    res.json(r);
  } catch (e) { res.status(500).json({ error: e?.message ?? String(e) }); }
});

app.post("/asic/:id/chip", async (req,res) => {
  const { chip, frequency, minerHost } = req.body || {};
  if (typeof chip !== "number" || typeof frequency !== "number") return res.status(400).json({ error: "chip (number) and frequency (number) required" });
  const host = minerHost || CGMINER_HOSTS[0];
  try {
    const r = await sendToCgminer(host, "ascset", `${req.params.id},chip,${chip}:${frequency}`);
    cache.del(`${host}|stats|`);
    res.json(r);
  } catch (e) { res.status(500).json({ error: e?.message ?? String(e) }); }
});

app.post("/asic/:id/require", async (req,res) => {
  const { threshold, minerHost } = req.body || {};
  if (typeof threshold !== "number") return res.status(400).json({ error: "threshold (number) required" });
  const host = minerHost || CGMINER_HOSTS[0];
  try {
    const r = await sendToCgminer(host, "ascset", `${req.params.id},require,${threshold}`);
    res.json(r);
  } catch (e) { res.status(500).json({ error: e?.message ?? String(e) }); }
});

app.post("/asic/:id/lock", async (req,res) => {
  const host = req.body?.minerHost || CGMINER_HOSTS[0];
  try {
    const r = await sendToCgminer(host, "ascset", `${req.params.id},lockfreq`);
    res.json(r);
  } catch (e) { res.status(500).json({ error: e?.message ?? String(e) }); }
});

app.post("/asic/:id/unlock", async (req,res) => {
  const host = req.body?.minerHost || CGMINER_HOSTS[0];
  try {
    const r = await sendToCgminer(host, "ascset", `${req.params.id},unlockfreq`);
    res.json(r);
  } catch (e) { res.status(500).json({ error: e?.message ?? String(e) }); }
});

app.post("/asic/:id/usbprop", async (req,res) => {
  const { usbprop, minerHost } = req.body || {};
  if (typeof usbprop !== "number") return res.status(400).json({ error: "usbprop (number) required" });
  const host = minerHost || CGMINER_HOSTS[0];
  try {
    const r = await sendToCgminer(host, "ascset", `${req.params.id},usbprop,${usbprop}`);
    res.json(r);
  } catch (e) { res.status(500).json({ error: e?.message ?? String(e) }); }
});

app.post("/asic/:id/reset", async (req,res) => {
  const host = req.body?.minerHost || CGMINER_HOSTS[0];
  try {
    const r = await sendToCgminer(host, "ascset", `${req.params.id},reset`);
    // small cooldown
    setTimeout(()=>cache.del(`${host}|stats|`), 1000);
    res.json(r);
  } catch (e) { res.status(500).json({ error: e?.message ?? String(e) }); }
});

/* Health and info */
app.get("/health", (req,res) => {
  res.json({
    status: "ok",
    host: os.hostname(),
    cgminer_hosts: CGMINER_HOSTS,
    cgminer_port: CGMINER_PORT
  });
});

/* Start HTTP server and WebSocket server */
const server = app.listen(HTTP_PORT, () => {
  console.log(`Bridge HTTP listening on :${HTTP_PORT} — CGMiner hosts -> ${CGMINER_HOSTS.join(",")}:${CGMINER_PORT}`);
});

// WebSocket server for logs / live updates
const wss = new WebSocketServer({ server, path: "/ws/logs" });
wss.on("connection", (ws) => {
  console.log("WS client connected");
  ws.send(JSON.stringify({ msg: "connected", ts: Date.now() }));
});

// Broadcast helper
function broadcast(obj) {
  const s = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(s);
  }
}

// Periodically poll cgminer stats and broadcast (every 2s)
setInterval(async () => {
  try {
    const results = {};
    for (const host of CGMINER_HOSTS) {
      const raw = await cached(host, "stats", undefined, 1000);
      results[host] = normalizeStats(raw);
    }
    broadcast({ type: "update", ts: Date.now(), miners: results });
  } catch (e) {
    broadcast({ type: "error", error: e?.message ?? String(e), ts: Date.now() });
  }
}, 2000);

process.on("SIGINT", () => { console.log("shutting down"); server.close(); process.exit(0); });
