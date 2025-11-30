export interface MinerStats {
  hashrate: number;
  hashrate5s: number;
  hashrate1m: number;
  hashrate5m: number;
  hashrate15m: number;
  accepted: number;
  rejected: number;
  hardwareErrors: number;
  utility: number;
  elapsed: number;
  temperature: number;
  fanSpeed?: number;
  frequency: number;
}

export interface PoolInfo {
  url: string;
  status: string;
  priority: number;
  user: string;
  accepted: number;
  rejected: number;
  stale: number;
  lastShareTime: number;
}

export interface DeviceInfo {
  id: number;
  name: string;
  status: string;
  temperature: number;
  hashrate: number;
  accepted: number;
  rejected: number;
  hardwareErrors: number;
  frequency: number;
}

export interface CGMinerSummary {
  elapsed: number;
  mhsAv: number;
  mhs5s: number;
  mhs1m: number;
  mhs5m: number;
  mhs15m: number;
  foundBlocks: number;
  getworks: number;
  accepted: number;
  rejected: number;
  hardwareErrors: number;
  utility: number;
  discarded: number;
  stale: number;
  getFailures: number;
  localWork: number;
  remoteFailures: number;
  networkBlocks: number;
  totalMh: number;
  workUtility: number;
  difficultyAccepted: number;
  difficultyRejected: number;
  difficultyStale: number;
  bestShare: number;
}
