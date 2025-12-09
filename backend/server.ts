import express, { Request, Response } from 'express';
import cors from 'cors';
import { sendCGMinerCommand } from './cgminer.ts';

const app = express();
const PORT = process.env.PORT || 3001;
const CGMINER_HOST = process.env.CGMINER_HOST || 'CGMINER_IP';
const CGMINER_PORT = parseInt(process.env.CGMINER_PORT || '4028');

app.use(cors({ origin: '*' }));
app.use(express.json());

let restarting = false;
const guard = (res: Response) => restarting && (res.status(503).json({ error: "CGMiner is restarting" }), true);

// -------- Generic Command --------
app.post('/api/command', async (req, res) => {
  try {
    const { command, parameter } = req.body;
    if (!command) return res.status(400).json({ error: 'command required' });
    res.json({ success: true, response: await sendCGMinerCommand(CGMINER_HOST, CGMINER_PORT, parameter ? `${command}|${parameter}` : command) });
  } catch (e:any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/health', (_,res) => res.json({ status:'ok' }));

// -------- Helpers --------
const get = (route: string, cmd: string, map?: any) =>
  app.get(route, async (req, res) => {
    if (guard(res)) return;
    try {
      const d = await sendCGMinerCommand(CGMINER_HOST, CGMINER_PORT, cmd);
      res.json(map ? map(d) : d);
    } catch (e:any) { res.status(500).json({ error: e.message }); }
  });

// -------- Summary --------
get('/api/stats','summary', d => {
  const s = d?.SUMMARY?.[0]; if (!s) return { error:'Invalid response' };
  return {
    elapsed: s.Elapsed || 0, mhsAv: s['MHS av'] || 0, mhs5s: s['MHS 5s'] || 0, mhs1m: s['MHS 1m'] || 0,
    mhs5m: s['MHS 5m'] || 0, mhs15m: s['MHS 15m'] || 0, foundBlocks: s['Found Blocks'] || 0,
    getworks: s.Getworks || 0, accepted: s.Accepted || 0, rejected: s.Rejected || 0,
    hardwareErrors: s['Hardware Errors'] || 0, utility: s.Utility || 0, discarded: s.Discarded || 0,
    stale: s.Stale || 0, getFailures: s['Get Failures'] || 0, localWork: s['Local Work'] || 0,
    remoteFailures: s['Remote Failures'] || 0, networkBlocks: s['Network Blocks'] || 0,
    totalMh: s['Total MH'] || 0, workUtility: s['Work Utility'] || 0,
    difficultyAccepted: s['Difficulty Accepted'] || 0, difficultyRejected: s['Difficulty Rejected'] || 0,
    difficultyStale: s['Difficulty Stale'] || 0, bestShare: s['Best Share'] || 0
  };
});

// -------- Simple GET wrappers --------
get('/api/devices','devs',    d => d?.DEVS ?? []);
get('/api/usbstats','usbstats',d => d?.USBSTATS ?? []);
get('/api/devdetails','devdetails',d => d?.DEVDETAILS ?? []);
get('/api/stats/raw','stats', d => d?.STATS ?? []);
get('/api/version','version', d => ({ version:(d?.VERSION ?? []).map((v:any)=>({ cgminer:v.CGMiner, api:v.API })) }));

get('/api/pools','pools', d => (d?.POOLS ?? []).map((p:any)=>({
  url:p.URL||'', status:p.Status||'Unknown', priority:p.Priority||0, user:p.User||'',
  accepted:p.Accepted||0, rejected:p.Rejected||0, frequency:p.Frequency||0,
  stale:p.Stale||0, lastShareTime:p['Last Share Time']||0
})));

get('/api/config','config', d => {
  const c = d?.CONFIG?.[0] ?? {};
  return {
    ascCount:c['ASC Count']||0, pgaCount:c['PGA Count']||0, poolCount:c['Pool Count']||0,
    strategy:c['Strategy']||'', logInterval:c['Log Interval']||0, deviceCode:c['Device Code']||'',
    os:c.OS||'', hotplug:c.Hotplug||0
  };
});

get('/api/coin','coin', d => {
  const c = d?.COIN?.[0] ?? {};
  return {
    hashMethod:c['Hash Method']||'', currentBlockTime:c['Current Block Time']||0,
    currentBlockHash:c['Current Block Hash']||'', lp:c.LP||false,
    networkDifficulty:c['Network Difficulty']||0
  };
});

get('/api/notify','notify', d => ({
  notify:(d?.NOTIFY ?? []).map((n:any)=>{
    const obj:any={}; for(const k in n)
      obj[k.replace(/^\*/,'').replace(/\s+([a-zA-Z0-9])/g,(_,c)=>c.toUpperCase()).replace(/^./,c=>c.toLowerCase())]=n[k];
    return obj;
  })
}));

get('/api/lcd','lcd', d => ({
  lcd:(d?.LCD ?? []).map((lcd:any)=>{
    const obj:any={}; for(const k in lcd)
      obj[k.replace(/\s+([a-zA-Z0-9])/g,(_,c)=>c.toUpperCase()).replace(/^./,c=>c.toLowerCase())]=lcd[k];
    return obj;
  })
}));

// -------- Restart / Quit / Save --------
app.post('/api/control/restart', async (req,res)=>{
  if (restarting) return res.status(409).json({ error:"Restart already in progress" });
  try {
    restarting = true;
    await new Promise(r=>setTimeout(r,400));
    res.json({ success:true, response:await sendCGMinerCommand(CGMINER_HOST,CGMINER_PORT,'restart') });
    setTimeout(()=>restarting=false,5000);
  } catch(e:any){ restarting=false; res.status(500).json({ error:e.message }); }
});

const post = (route:string, handler:(b:any)=>string) =>
  app.post(route, async (req,res)=>{
    if (guard(res)) return;
    try { res.json({ success:true, response:await sendCGMinerCommand(CGMINER_HOST,CGMINER_PORT,handler(req.body))}); }
    catch(e:any){ res.status(500).json({ error:e.message }); }
  });

post('/api/control/quit',()=>`quit`);
post('/api/control/save',b=>b.filename?`save|${b.filename}`:`save`);

// -------- Pool Control --------
post('/api/pools/add',     b=>`addpool|${b.url},${b.user},${b.pass}`);
post('/api/pools/remove',  b=>`removepool|${b.poolId}`);
post('/api/pools/enable',  b=>`enablepool|${b.poolId}`);
post('/api/pools/disable', b=>`disablepool|${b.poolId}`);
post('/api/pools/switch',  b=>`switchpool|${b.poolId}`);
post('/api/pools/priority',b=>`poolpriority|${b.priorities.join(',')}`);

// -------- Device Control --------
post('/api/devices/enable', b=>`ascenable|${b.deviceId}`);
post('/api/devices/disable',b=>`ascdisable|${b.deviceId}`);

// ---------------------- START SERVER ----------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`CGMiner proxy server running on http://0.0.0.0:${PORT}`);
  console.log(`Connecting to CGMiner at ${CGMINER_HOST}:${CGMINER_PORT}`);
});

