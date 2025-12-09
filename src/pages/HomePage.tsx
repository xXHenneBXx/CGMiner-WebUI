import { useEffect, useState } from 'react';
import {Activity, Zap, TrendingUp, AlertTriangle, Trophy, Clock, Star, Cpu} from 'lucide-react';
import { cgminerAPI } from '../services/cgminer';

import {
  SummaryInfo,
  DeviceInfo,
  PoolInfo,
  CoinInfo,
  LCDInfo,
  VersionInfo,
  NotifyInfo,
} from '../types/miner';

import { StatCard } from '../components/StatCard';
import { DeviceCard } from '../components/DeviceCard';
import { PoolCard } from '../components/PoolCard';
import { ControlPanel } from '../components/ControlPanel';

interface MergedDeviceInfo extends DeviceInfo {
  serial?: string;
  frequency?: number;
  chips?: number;
  voltage?: number;
  fanSpeed?: number;
  rolling?: number;
  ghghs?: number;
}

export function HomePage() {
  // --- State ---
  const [summary, setSummary] = useState<SummaryInfo | null>(null);
  const [devices, setDevices] = useState<MergedDeviceInfo[]>([]);
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [coin, setCoin] = useState<CoinInfo | null>(null);
  const [lcd, setLcd] = useState<LCDInfo | null>(null);
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [notify, setNotify] = useState<NotifyInfo[] | []>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Fetch CGMiner Data ---
  const fetchData = async () => {
    try {
      setError(null);

      const [
        summaryData,
        devicesData,
        poolsData,
        coinData,
        lcdData,
        versionData,
        notifyData,
        statsRawData,
      ] = await Promise.all([
        cgminerAPI.getSummary(),
        cgminerAPI.getDevices(),
        cgminerAPI.getPools(),
        cgminerAPI.getCoin(),
        cgminerAPI.getLcd(),
        cgminerAPI.getVersion(),
        cgminerAPI.getNotify(),
        cgminerAPI.getStatsRaw(),
      ]);

      // Merge device data with stats/raw data
      const mergedDevices = mergeDeviceData(devicesData, statsRawData);

      setSummary(summaryData);
      setDevices(mergedDevices);
      setPools(poolsData);
      setCoin(coinData);
      setLcd(lcdData);
      setVersion(versionData);
      setNotify(notifyData);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to connect to CGMiner. Make sure the API is accessible.');
      setLoading(false);
    }
  };

  // --- Merge Device Data with Stats ---
  const mergeDeviceData = (devices: any[], statsRaw: any[]): MergedDeviceInfo[] => {
    return devices
      .filter((dev: any) => {
        // Filter out disabled devices or devices with no activity
        return dev.Enabled === 'Y' && !dev['No Device'];
      })
      .map((dev: any) => {
        // Find matching stats by ID (device ID matches STATS index)
        const matchingStat = statsRaw.find((stat: any) => stat.STATS === dev.ID);
        
        return {
          id: dev.ID || 0,
          name: dev.Name || 'Unknown',
          status: dev.Status || 'Unknown',
          temperature: dev.Temperature || 0,
          hashrate: dev['MHS 5s'] || 0,
          mhs5s: dev['MHS 5s'] || 0,
          mhsAv: dev['MHS av'] || 0,
          accepted: dev.Accepted || 0,
          rejected: dev.Rejected || 0,
          hardwareErrors: dev['Hardware Errors'] || 0,
          
          // From stats/raw
          serial: matchingStat?.Serial || undefined,
          frequency: matchingStat?.Frequency || matchingStat?.FreqSel || 0,
          chips: matchingStat?.Chips || 0,
          voltage: matchingStat?.Voltage || 0,
          fanSpeed: matchingStat?.FanSpeed || matchingStat?.['Fan Speed'] || 0,
          rolling: matchingStat?.Rolling || 0,
          ghghs: matchingStat?.GHGHs || 0,
        };
      });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);
  
  // ---------------------- Formatting helpers ----------------------
  const formatHashrate = (hashrate: number) => {
    if (!hashrate) return '0 MH/s';
    if (hashrate < 1_000) return `${hashrate.toFixed(2)} MH/s`;
    if (hashrate < 1_000_000) return `${(hashrate / 1_000).toFixed(2)} GH/s`;
    if (hashrate < 1_000_000_000) return `${(hashrate / 1_000_000).toFixed(2)} TH/s`;
    return `${(hashrate / 1_000_000_000).toFixed(2)} PH/s`;
  };

  const formatBestShare = (bestShare: number) => {
    if (!bestShare) return '0';
    if (bestShare < 1_000) return bestShare.toFixed(2);
    if (bestShare < 1_000_000) return `${(bestShare / 1_000).toFixed(2)} K`;
    if (bestShare < 1_000_000_000) return `${(bestShare / 1_000_000).toFixed(2)} M`;
    return `${(bestShare / 1_000_000_000).toFixed(2)} B`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const calculateAcceptanceRate = () => {
    if (!summary || summary.accepted + summary.rejected === 0) return 0;
    return (summary.accepted / (summary.accepted + summary.rejected)) * 100;
  };

  const getTotalChips = () => {
    return devices.reduce((sum, dev) => sum + (dev.chips || 0), 0);
  };

  const getAverageFrequency = () => {
    const activeDevices = devices.filter(d => d.frequency && d.frequency > 0);
    if (activeDevices.length === 0) return 0;
    const total = activeDevices.reduce((sum, dev) => sum + (dev.frequency || 0), 0);
    return Math.round(total / activeDevices.length);
  };

  // --- Loading UI ---
  if (loading) {
    return (
      <div className="flex items-center justify-center md:py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Connecting to CGMiner...</p>
        </div>
      </div>
    );
  }

  // --- Error UI ---
  if (error) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="bg-gray-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 text-red-800 mb-2">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Connection Error</h2>
          </div>
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // --------------------------
  //      MAIN DASHBOARD
  // --------------------------
  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Hashrate (5s)"
          value={formatHashrate(summary?.mhs5s || 0)}
          icon={<Activity className="w-6 h-6 text-green-500" />}
          subtitle={`Avg: ${formatHashrate(summary?.mhsAv || 0)}`}
          trend={summary && summary.mhs5s > (summary?.mhsAv || 0) ? 'up' : 'down'}
        />
        <StatCard
          title="Acceptance Rate"
          value={`${calculateAcceptanceRate().toFixed(2)}%`}
          icon={<TrendingUp className="w-6 h-6 text-blue-500" />}
          subtitle={`${summary?.accepted || 0} accepted / ${summary?.rejected || 0} rejected`}
          trend={calculateAcceptanceRate() > 99 ? 'up' : calculateAcceptanceRate() > 95 ? 'neutral' : 'down'}
        />
        <StatCard
          title="Best Share"
          value={formatBestShare(summary?.bestShare || 0)}
          icon={<Star className="w-6 h-6 text-yellow-500" />}
          subtitle={`Difficulty: ${summary?.difficultyAccepted?.toLocaleString() || 0}`}
        />
        <StatCard
          title="Hardware Errors"
          value={summary?.hardwareErrors || 0}
          icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
          subtitle={`Error Rate: ${summary && summary.accepted > 0 ? ((summary.hardwareErrors / summary.accepted) * 100).toFixed(3) : 0}%`}
          trend={summary && summary.hardwareErrors > 0 ? 'down' : 'neutral'}
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Devices"
          value={devices.length}
          icon={<Cpu className="w-6 h-6 text-purple-500" />}
          subtitle={`Total Chips: ${getTotalChips()}`}
        />
        <StatCard
          title="Avg Frequency"
          value={`${getAverageFrequency()} MHz`}
          icon={<Zap className="w-6 h-6 text-yellow-400" />}
          subtitle={devices.length > 0 ? 'Across all devices' : 'No active devices'}
        />
        <StatCard
          title="Utility"
          value={summary?.utility?.toFixed(2) || 0}
          unit="shares/min"
          icon={<Zap className="w-6 h-6 text-cyan-400" />}
          subtitle={`Work Utility: ${summary?.workUtility?.toFixed(2) || 0}`}
        />
        <StatCard
          title="Uptime"
          value={formatUptime(summary?.elapsed || 0)}
          icon={<Clock className="w-6 h-6 text-indigo-400" />}
          subtitle={`Since ${new Date(Date.now() - (summary?.elapsed || 0) * 1000).toLocaleTimeString()}`}
        />
      </div>

      {/* Devices & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-blue-600">Device Status</h2>
            <span className="text-sm text-gray-400">
              {devices.length} Active {devices.length === 1 ? 'Device' : 'Devices'}
            </span>
          </div>
          <div className="space-y-4">
            {devices.length ? (
              devices.map(device => (
                <DeviceCard key={device.id} device={device} />
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No active devices detected</p>
                <p className="text-sm mt-1">Check your miner connections</p>
              </div>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-blue-600 mb-4">Controls</h2>
          <ControlPanel onRefresh={fetchData} />
        </div>
      </div>

      {/* Pools */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-blue-600">Mining Pools</h2>
          <span className=" text-sm text-gray-400">
            {Array.isArray(pools) ? pools.length : 0} {Array.isArray(pools) && pools.length === 1 ? 'Pool' : 'Pools'}
          </span>
        </div>
        {Array.isArray(pools) && pools.length ? (
          pools.map((pool, idx) => <PoolCard key={idx} pool={pool} devices={devices} />)
        ) : (
          <div className="flex-1 bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No pool connections found</p>
            <p className="text-sm mt-1">Configure your mining pools</p>
          </div>
        )}
      </div>

      {/* Performance, Shares, Network */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Performance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Performance Over Time
          </h3>
          <div className="space-y-3">
            {[
              { key: 'mhs5s', label: '5 Seconds' },
              { key: 'mhs1m', label: '1 Minute' },
              { key: 'mhs5m', label: '5 Minutes' },
              { key: 'mhs15m', label: '15 Minutes' }
            ].map(({ key, label }) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-600">{label}</span>
                <span className="font-medium text-green-600">
                  {formatHashrate((summary as any)?.[key] || 0)}
                </span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-semibold">Total MH</span>
                <span className="font-bold text-blue-600">
                  {summary?.totalMh?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Shares */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Share Statistics
          </h3>
          <div className="space-y-3">
            {[
              { key: 'accepted', label: 'Accepted', color: 'text-green-600' },
              { key: 'rejected', label: 'Rejected', color: 'text-red-600' },
              { key: 'stale', label: 'Stale', color: 'text-yellow-600' },
              { key: 'discarded', label: 'Discarded', color: 'text-gray-600' }
            ].map(({ key, label, color }) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-600">{label}</span>
                <span className={`font-medium ${color}`}>
                  {(summary as any)?.[key]?.toLocaleString() || 0}
                </span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-semibold">Best Share</span>
                <span className="font-bold text-yellow-600">
                  {formatBestShare(summary?.bestShare || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Network Stats */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Network Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Algorithm</span>
              <span className="font-medium text-purple-600">{coin?.hashMethod || 'Unknown'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Network Difficulty</span>
              <span className="font-medium text-red-600">{coin?.networkDifficulty?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Network Blocks</span>
              <span className="font-medium text-blue-600">{summary?.networkBlocks || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Blocks Found</span>
              <span className="font-medium text-green-600">{lcd?.foundBlocks || summary?.foundBlocks || 0}</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-semibold">Difficulty Accepted</span>
                <span className="font-bold text-green-600">
                  {summary?.difficultyAccepted?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}