import {
  MinerStats, PoolInfo, DeviceInfo, SummaryInfo, VersionInfo,
  NotifyInfo, LCDInfo, CoinInfo, RawStatsInfo
} from '../types/miner';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:3001`;

export class CGMinerAPI {
  constructor(private baseUrl: string = BACKEND_URL) {}

  private async request(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    try {
      const r = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) { console.error('Backend API Error:', e); throw e; }
  }

  // --- Small helpers to reduce code ---
  private async tryGet<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try { return await fn(); } catch { return fallback; }
  }

  private async tryPost(endpoint: string, body?: any): Promise<boolean> {
    try { await this.request(endpoint, 'POST', body); return true; } catch { return false; }
  }

  /* ------------------------------ BASIC STATS ------------------------------ */

  getSummary()          { return this.tryGet(() => this.request('/api/stats'), null); }
  getDevices()          { return this.tryGet(() => this.request('/api/devices'), []); }
  getPools()            { return this.tryGet(() => this.request('/api/pools'), []); }
  getStatsRaw()         { return this.tryGet(() => this.request('/api/stats/raw'), []); }
  getCoin()             { return this.tryGet(() => this.request('/api/coin'), null); }

  async getVersion()    { return (await this.tryGet(() => this.request('/api/version'), null))?.version?.[0] || null; }
  async getNotify()     { return (await this.tryGet(() => this.request('/api/notify'), { notify: [] })).notify; }
  async getLcd()        { return (await this.tryGet(() => this.request('/api/lcd'), { lcd: [] })).lcd?.[0] || null; }

  /* ------------------------------ CONTROL COMMANDS ------------------------------ */

  restart()             { return this.tryPost('/api/control/restart'); }
  quit()                { return this.tryPost('/api/control/quit'); }
  saveConfig(filename?: string) {
    return this.tryPost('/api/control/save', filename ? { filename } : {});
  }

  /* ------------------------------ POOL CONTROL ------------------------------ */

  addPool(url:string, user:string, pass:string)  { return this.tryPost('/api/pools/add', { url, user, pass }); }
  removePool(id:number)                           { return this.tryPost('/api/pools/remove', { poolId:id }); }
  enablePool(id:number)                           { return this.tryPost('/api/pools/enable', { poolId:id }); }
  disablePool(id:number)                          { return this.tryPost('/api/pools/disable', { poolId:id }); }
  switchPool(id:number)                           { return this.tryPost('/api/pools/switch', { poolId:id }); }
  setPoolPriority(priorities:number[])            { return this.tryPost('/api/pools/priority', { priorities }); }

  /* ------------------------------ DEVICE CONTROL ------------------------------ */

  enableDevice(id:number)                         { return this.tryPost('/api/devices/enable', { deviceId:id }); }
  disableDevice(id:number)                        { return this.tryPost('/api/devices/disable', { deviceId:id }); }
  setDeviceFrequency(id:number, freq:number)      { return this.tryPost('/api/devices/frequency', { deviceId:id, frequency:freq }); }
  setDeviceOption(id:number, opt:string, value?:string) {
    return this.tryPost('/api/devices/set', { deviceId:id, option:opt, value });
  }

  async setHotplug(seconds:number): Promise<boolean> {
    try { return (await this.request('/api/devices/hotplug', 'POST', { seconds })).success === true; }
    catch { return false; }
  }

  /* ------------------------------ CONFIG API ------------------------------ */

  getConfig()            { return this.tryGet(() => this.request('/api/config'), {}); }
  setConfig(name:string, value:number) { return this.tryPost('/api/config/set', { name, value }); }
}

export const cgminerAPI = new CGMinerAPI();
