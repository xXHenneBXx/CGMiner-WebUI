import { MinerStats, PoolInfo, DeviceInfo, CGMinerSummary } from '../types/miner';

// Use the current hostname dynamically, fallback to environment variable
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:3001`;


export class CGMinerAPI {
  private baseUrl: string;

  constructor(backendUrl: string = BACKEND_URL) {
    this.baseUrl = backendUrl;
  }

  private async request(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Backend API error:', error);
      throw error;
    }
  }

  async getSummary(): Promise<CGMinerSummary | null> {
    try {
      return await this.request('/api/stats');
    } catch (error) {
      console.error('Error fetching summary:', error);
      return null;
    }
  }

  async getDevices(): Promise<DeviceInfo[]> {
    try {
      return await this.request('/api/devices');
    } catch (error) {
      console.error('Error fetching devices:', error);
      return [];
    }
  }

  async getPools(): Promise<PoolInfo[]> {
    try {
      return await this.request('/api/pools');
    } catch (error) {
      console.error('Error fetching pools:', error);
      return [];
    }
  }

  async restart(): Promise<boolean> {
    try {
      await this.request('/api/control/restart', 'POST');
      return true;
    } catch (error) {
      console.error('Error restarting miner:', error);
      return false;
    }
  }

  async quit(): Promise<boolean> {
    try {
      await this.request('/api/control/stop', 'POST');
      return true;
    } catch (error) {
      console.error('Error stopping miner:', error);
      return false;
    }
  }

  async addPool(url: string, user: string, pass: string): Promise<boolean> {
    try {
      await this.request('/api/pools/add', 'POST', { url, user, pass });
      return true;
    } catch (error) {
      console.error('Error adding pool:', error);
      return false;
    }
  }

  async removePool(poolId: number): Promise<boolean> {
    try {
      await this.request('/api/pools/remove', 'POST', { poolId });
      return true;
    } catch (error) {
      console.error('Error removing pool:', error);
      return false;
    }
  }

  async enablePool(poolId: number): Promise<boolean> {
    try {
      await this.request('/api/pools/enable', 'POST', { poolId });
      return true;
    } catch (error) {
      console.error('Error enabling pool:', error);
      return false;
    }
  }

  async disablePool(poolId: number): Promise<boolean> {
    try {
      await this.request('/api/pools/disable', 'POST', { poolId });
      return true;
    } catch (error) {
      console.error('Error disabling pool:', error);
      return false;
    }
  }

  async setPoolPriority(priorities: number[]): Promise<boolean> {
    try {
      await this.request('/api/pools/priority', 'POST', { priorities });
      return true;
    } catch (error) {
      console.error('Error setting pool priority:', error);
      return false;
    }
  }

  async enableDevice(deviceId: number): Promise<boolean> {
    try {
      await this.request('/api/devices/enable', 'POST', { deviceId });
      return true;
    } catch (error) {
      console.error('Error enabling device:', error);
      return false;
    }
  }

  async disableDevice(deviceId: number): Promise<boolean> {
    try {
      await this.request('/api/devices/disable', 'POST', { deviceId });
      return true;
    } catch (error) {
      console.error('Error disabling device:', error);
      return false;
    }
  }

  async setDeviceFrequency(deviceId: number, frequency: number): Promise<boolean> {
    try {
      await this.request('/api/devices/frequency', 'POST', { deviceId, frequency });
      return true;
    } catch (error) {
      console.error('Error setting device frequency:', error);
      return false;
    }
  }

  async setDeviceOption(deviceId: number, option: string, value?: string): Promise<boolean> {
    try {
      await this.request('/api/devices/set', 'POST', { deviceId, option, value });
      return true;
    } catch (error) {
      console.error('Error setting device option:', error);
      return false;
    }
  }

  async getConfig(): Promise<any> {
    try {
      return await this.request('/api/config');
    } catch (error) {
      console.error('Error fetching config:', error);
      return {};
    }
  }

  async setConfig(name: string, value: number): Promise<boolean> {
    try {
      await this.request('/api/config/set', 'POST', { name, value });
      return true;
    } catch (error) {
      console.error('Error setting config:', error);
      return false;
    }
  }
}

export const cgminerAPI = new CGMinerAPI();
