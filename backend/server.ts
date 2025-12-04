import express, { Request, Response } from 'express';
import cors from 'cors';
import { createCGMinerConnection, sendCGMinerCommand } from './cgminer.ts';

const app = express();
const PORT = process.env.PORT || 3001; // TCP-HTTP Proxy Port
const CGMINER_HOST = process.env.CGMINER_HOST || '192.168.0.85'; ; // 'localhost' if runnning on host machine, Use Host IP of CGMiner instead
const CGMINER_PORT = parseInt(process.env.CGMINER_PORT || '4028'); // Default CGMiner Port 

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Stats summary
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const data = await sendCGMinerCommand(CGMINER_HOST, CGMINER_PORT, 'summary');
    if (data?.SUMMARY?.[0]) {
      const summary = data.SUMMARY[0];
      res.json({
        elapsed: summary['Elapsed'] || 0,
        mhsAv: summary['MHS av'] || 0,
        mhs5s: summary['MHS 5s'] || 0,
        mhs1m: summary['MHS 1m'] || 0,
        mhs5m: summary['MHS 5m'] || 0,
        mhs15m: summary['MHS 15m'] || 0,
		frequency: summary['Frequency'] || 0,
        foundBlocks: summary['Found Blocks'] || 0,
        getworks: summary['Getworks'] || 0,
        accepted: summary['Accepted'] || 0,
        rejected: summary['Rejected'] || 0,
        hardwareErrors: summary['Hardware Errors'] || 0,
        utility: summary['Utility'] || 0,
        discarded: summary['Discarded'] || 0,
        stale: summary['Stale'] || 0,
        getFailures: summary['Get Failures'] || 0,
        localWork: summary['Local Work'] || 0,
        remoteFailures: summary['Remote Failures'] || 0,
        networkBlocks: summary['Network Blocks'] || 0,
        totalMh: summary['Total MH'] || 0,
        workUtility: summary['Work Utility'] || 0,
        difficultyAccepted: summary['Difficulty Accepted'] || 0,
        difficultyRejected: summary['Difficulty Rejected'] || 0,
        difficultyStale: summary['Difficulty Stale'] || 0,
        bestShare: summary['Best Share'] || 0,
		serial: summary['Serial'] || 'Uknown',
      });
    } else {
      res.status(500).json({ error: 'Invalid response from CGMiner' });
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Devices
app.get('/api/devices', async (req: Request, res: Response) => {
  try {
    const data = await sendCGMinerCommand(CGMINER_HOST, CGMINER_PORT, 'devs');
	const fallbackFreq = await getFrequencyFromStats();
    if (data?.DEVS) {
      const devices = data.DEVS.map((dev: any) => ({
        id: dev['ID'] || 0,
        name: dev['Name'] || 'Unknown',
		serial: dev['Serial'] || 'Uknown',
        status: dev['Status'] || 'Unknown',
        temperature: dev['Temperature'] || 0,
        hashrate: dev['MHS 5s'] || 0,
		mhs5s: dev['MHS 5s'] || 0,
        mhsAv: dev['MHS av'] || 0,
        accepted: dev['Accepted'] || 0,
        rejected: dev['Rejected'] || 0,
        hardwareErrors: dev['Hardware Errors'] || 0,
        frequency: dev['Frequency'] || fallbackFreq || 0,
        utility: dev['Utility'] || 0,
        elapsed: dev['Elapsed'] || 0,
		chips: dev['Chips'] || 1,
		chipType: dev['Chip'] || dev['ChipModel'] || 'Unknown',
		fanSpeed: dev['Fan Speed'] || 0,
      }));
      res.json(devices);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

async function getFrequencyFromStats() {
  try {
    const statsData = await sendCGMinerCommand(CGMINER_HOST, CGMINER_PORT, 'stats');
    const first = statsData?.STATS?.[0];

    return Number(
      first?.Frequency ??
      first?.Freq ??
      first?.FreqSel ??
      0
    );
  } catch {
    return 0;
  }
}

// Pools
app.get('/api/pools', async (req: Request, res: Response) => {
  try {
    const data = await sendCGMinerCommand(CGMINER_HOST, CGMINER_PORT, 'pools');
    if (data?.POOLS) {
      const pools = data.POOLS.map((pool: any) => ({
        url: pool['URL'] || '',
        status: pool['Status'] || 'Unknown',
        priority: pool['Priority'] || 0,
        user: pool['User'] || '',
        accepted: pool['Accepted'] || 0,
        rejected: pool['Rejected'] || 0,
		frequency: pool['Frequency'] || 0,
        stale: pool['Stale'] || 0,
        lastShareTime: pool['Last Share Time'] || 0,
      }));
      res.json(pools);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching pools:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Control: Restart
app.post('/api/control/restart', async (req: Request, res: Response) => {
  try {
    await sendCGMinerCommand(CGMINER_HOST, CGMINER_PORT, 'restart');
    res.json({ success: true });
  } catch (error) {
    console.error('Error restarting miner:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Control: Stop
app.post('/api/control/stop', async (req: Request, res: Response) => {
  try {
    await sendCGMinerCommand(CGMINER_HOST, CGMINER_PORT, 'quit');
    res.json({ success: true });
  } catch (error) {
    console.error('Error stopping miner:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Pool Management: Add Pool
app.post('/api/pools/add', async (req: Request, res: Response) => {
  try {
    const { url, user, pass } = req.body;
    const command = `addpool|${url},${user},${pass}`;
    await sendCGMinerCommand(CGMINER_HOST, CGMINER_PORT, command);
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding pool:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Pool Management: Remove Pool
app.post('/api/pools/remove', async (req: Request, res: Response) => {
  try {
    const { poolId } = req.body;
    const command = `removepool|${poolId}`;
    await sendCGMinerCommand(CGMINER_HOST, CGMINER_PORT, command);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing pool:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Pool Management: Enable Pool
app.post('/api/pools/enable', async (req: Request, res: Response) => {
  try {
    const { poolId } = req.body;
    const command = `enablepool|${poolId}`;
    await sendCGMinerCommand(CGMINER_HOST, CGMINER_PORT, command);
    res.json({ success: true });
  } catch (error) {
    console.error('Error enabling pool:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Pool Management: Disable Pool
app.post('/api/pools/disable', async (req: Request, res: Response) => {
  try {
    const { poolId } = req.body;
    const command = `disablepool|${poolId}`;
    await sendCGMinerCommand(CGMINER_HOST, CGMINER_PORT, command);
    res.json({ success: true });
  } catch (error) {
    console.error('Error disabling pool:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Pool Management: Set Priority
app.post('/api/pools/priority', async (req: Request, res: Response) => {
  try {
    const { priorities } = req.body;
    const command = `poolpriority|${priorities.join(',')}`;
    await sendCGMinerCommand(CGMINER_HOST, CGMINER_PORT, command);
    res.json({ success: true });
  } catch (error) {
    console.error('Error setting pool priority:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Device Management: Enable Device
app.post('/api/devices/enable', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.body;
    const command = `ascenable|${deviceId}`;
    await sendCGMinerCommand(CGMINER_HOST, CGMINER_PORT, command);
    res.json({ success: true });
  } catch (error) {
    console.error('Error enabling device:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Device Management: Disable Device
app.post('/api/devices/disable', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.body;
    const command = `ascdisable|${deviceId}`;
    await sendCGMinerCommand(CGMINER_HOST, CGMINER_PORT, command);
    res.json({ success: true });
  } catch (error) {
    console.error('Error disabling device:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Device Management: Set Frequency
app.post('/api/devices/frequency', async (req: Request, res: Response) => {
  try {
    const { deviceId, frequency } = req.body;
    const command = `ascset|${deviceId},freq,${frequency}`;
    await sendCGMinerCommand(CGMINER_HOST, CGMINER_PORT, command);
    res.json({ success: true });
  } catch (error) {
    console.error('Error setting device frequency:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Device Management: Set Device Option
app.post('/api/devices/set', async (req: Request, res: Response) => {
  try {
    const { deviceId, option, value } = req.body;
    const command = value ? `ascset|${deviceId},${option},${value}` : `ascset|${deviceId},${option}`;
    await sendCGMinerCommand(CGMINER_HOST, CGMINER_PORT, command);
    res.json({ success: true });
  } catch (error) {
    console.error('Error setting device option:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Configuration: Get Config
app.get('/api/config', async (req: Request, res: Response) => {
  try {
    const data = await sendCGMinerCommand(CGMINER_HOST, CGMINER_PORT, 'config');
    res.json(data?.CONFIG?.[0] || {});
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Configuration: Set Config
app.post('/api/config/set', async (req: Request, res: Response) => {
  try {
    const { name, value } = req.body;
    const command = `setconfig|${name},${value}`;
    await sendCGMinerCommand(CGMINER_HOST, CGMINER_PORT, command);
    res.json({ success: true });
  } catch (error) {
    console.error('Error setting config:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CGMiner proxy server running on http://0.0.0.0:${PORT}`);
  console.log(`Connecting to CGMiner at ${CGMINER_HOST}:${CGMINER_PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/health');
  console.log('  GET  /api/stats');
  console.log('  GET  /api/devices');
  console.log('  GET  /api/pools');
  console.log('  GET  /api/config');
  console.log('  POST /api/control/restart');
  console.log('  POST /api/control/stop');
  console.log('  POST /api/pools/add');
  console.log('  POST /api/pools/remove');
  console.log('  POST /api/pools/enable');
  console.log('  POST /api/pools/disable');
  console.log('  POST /api/pools/priority');
  console.log('  POST /api/devices/enable');
  console.log('  POST /api/devices/disable');
  console.log('  POST /api/devices/frequency');
  console.log('  POST /api/devices/set');
  console.log('  POST /api/config/set');
});
