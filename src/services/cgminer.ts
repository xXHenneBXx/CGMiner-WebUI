import { MinerStats, PoolInfo, DeviceInfo, CGMinerSummary } from '../types/miner';

const CGMINER_HOST = import.meta.env.VITE_CGMINER_HOST || '192.168.0.200';
const CGMINER_PORT = import.meta.env.VITE_CGMINER_PORT || '4028';

export class CGMinerAPI {
  private baseUrl: string;

  constructor(host: string = CGMINER_HOST, port: string = CGMINER_PORT) {
    this.baseUrl = `http://${host}:${port}`;
  }

  private async sendCommand(command: string, parameter?: string): Promise<any> {
    const payload = parameter ? `${command}|${parameter}` : command;
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cgminer`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: payload }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CGMiner API error:', error);
      throw error;
    }
  }

  async getSummary(): Promise<CGMinerSummary | null> {
    try {
      const data = await this.sendCommand('summary');
      if (data?.SUMMARY?.[0]) {
        const summary = data.SUMMARY[0];
        return {
          elapsed: summary['Elapsed'] || 0,
          mhsAv: summary['MHS av'] || 0,
          mhs5s: summary['MHS 5s'] || 0,
          mhs1m: summary['MHS 1m'] || 0,
          mhs5m: summary['MHS 5m'] || 0,
          mhs15m: summary['MHS 15m'] || 0,
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
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching summary:', error);
      return null;
    }
  }

  async getDevices(): Promise<DeviceInfo[]> {
    try {
      const data = await this.sendCommand('devs');
      if (data?.DEVS) {
        return data.DEVS.map((dev: any) => ({
          id: dev['ID'] || 0,
          name: dev['Name'] || 'Unknown',
          status: dev['Status'] || 'Unknown',
          temperature: dev['Temperature'] || 0,
          hashrate: dev['MHS 5s'] || 0,
          accepted: dev['Accepted'] || 0,
          rejected: dev['Rejected'] || 0,
          hardwareErrors: dev['Hardware Errors'] || 0,
          frequency: dev['Frequency'] || 0,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching devices:', error);
      return [];
    }
  }

  async getPools(): Promise<PoolInfo[]> {
    try {
      const data = await this.sendCommand('pools');
      if (data?.POOLS) {
        return data.POOLS.map((pool: any) => ({
          url: pool['URL'] || '',
          status: pool['Status'] || 'Unknown',
          priority: pool['Priority'] || 0,
          user: pool['User'] || '',
          accepted: pool['Accepted'] || 0,
          rejected: pool['Rejected'] || 0,
          stale: pool['Stale'] || 0,
          lastShareTime: pool['Last Share Time'] || 0,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching pools:', error);
      return [];
    }
  }

  async restart(): Promise<boolean> {
    try {
      await this.sendCommand('restart');
      return true;
    } catch (error) {
      console.error('Error restarting miner:', error);
      return false;
    }
  }

  async quit(): Promise<boolean> {
    try {
      await this.sendCommand('quit');
      return true;
    } catch (error) {
      console.error('Error stopping miner:', error);
      return false;
    }
  }
}

export const cgminerAPI = new CGMinerAPI();
