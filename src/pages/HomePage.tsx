import { useEffect, useState } from 'react';
import { Activity, Zap, TrendingUp, AlertTriangle, Thermometer, Clock } from 'lucide-react';
import { cgminerAPI } from '../services/cgminer';
import { CGMinerSummary, DeviceInfo, PoolInfo } from '../types/miner';
import { StatCard } from '../components/StatCard';
import { DeviceCard } from '../components/DeviceCard';
import { PoolCard } from '../components/PoolCard';
import { ControlPanel } from '../components/ControlPanel';

export function HomePage() {
  const [summary, setSummary] = useState<CGMinerSummary | null>(null);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [summaryData, devicesData, poolsData] = await Promise.all([
        cgminerAPI.getSummary(),
        cgminerAPI.getDevices(),
        cgminerAPI.getPools(),
      ]);

      setSummary(summaryData);
      setDevices(devicesData);
      setPools(poolsData);
      setLoading(false);
    } catch (err) {
      setError('Failed to connect to CGMiner. Make sure the API is accessible.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Connecting to CG Miner...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
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

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Hashrate (5s)"
          value={((summary?.mhs5s || 0) / 1000).toFixed(2)}
          unit="GH/s"
          icon={<Activity className="w-6 text-green-500 h-6" />}
          subtitle={`Avg: ${((summary?.mhsAv || 0) / 1000).toFixed(2)} GH/s`}
        />
        <StatCard
          title="Accepted Shares"
          value={summary?.accepted || 0}
          icon={<TrendingUp className="w-6 h-6" />}
          subtitle={`${calculateAcceptanceRate().toFixed(2)}% acceptance rate`}
          trend="up"
        />
        <StatCard
          title="Hardware Errors"
          value={summary?.hardwareErrors || 0}
          icon={<AlertTriangle className="w-6 text-red-500 h-6" />}
          subtitle={`${summary?.rejected || 0} rejected shares`}
          trend={summary && summary.hardwareErrors > 0 ? 'down' : 'neutral'}
        />
        <StatCard
          title="Utility"
          value={summary?.utility || 0}
          unit="shares/min"
          icon={<Zap className="w-6 text-yellow-400 h-6" />}
        />
        <StatCard
          title="Temperature"
          value={devices[0]?.temperature || 0}
          unit="°C"
          icon={<Thermometer className="w-6 text-orange-500 h-6" />}
          trend={devices[0]?.temperature > 75 ? 'down' : 'neutral'}
        />
        <StatCard
          title="Uptime"
          value={summary ? formatUptime(summary.elapsed) : '0s'}
          icon={<Clock className="w-6 text-cyan-400 h-6" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Device Status</h2>
          <div className="space-y-4">
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={{
                  ...device,
                  hashrate: device.hashrate / 1000,
                  mhs5s: device.mhs5s / 1000,
                  mhsAv: device.mhsAv / 1000,
                  Frequency: device.frequency,
                }}
              />
            ))}
            {devices.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                No devices detected
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Controls</h2>
          <ControlPanel onRefresh={fetchData} />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Mining Pools</h2>
        <div className="space-y-4">
          {pools.map((pool, index) => (
            <PoolCard key={index} pool={pool} />
          ))}
          {pools.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
              No pool connections found
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">5 Seconds</span>
              <span className="font-medium">{((summary?.mhs5s || 0) / 1000).toFixed(2)} GH/s</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">1 Minute</span>
              <span className="font-medium">{((summary?.mhs1m || 0) / 1000).toFixed(2)} GH/s</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">5 Minutes</span>
              <span className="font-medium">{((summary?.mhs5m || 0) / 1000).toFixed(2)} GH/s</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">15 Minutes</span>
              <span className="font-medium">{((summary?.mhs15m || 0) / 1000).toFixed(2)} GH/s</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Shares</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Accepted Shares</span>
              <span className="font-medium text-green-600">{summary?.accepted || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Rejected Shares</span>
              <span className="font-medium text-red-600">{summary?.rejected || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Stale Shares</span>
              <span className="font-medium text-yellow-600">{summary?.stale || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Best Share</span>
              <span className="font-medium">{summary?.bestShare || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Difficulty</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Accepted</span>
              <span className="font-medium">{(summary?.difficultyAccepted || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Rejected</span>
              <span className="font-medium">{(summary?.difficultyRejected || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Stale</span>
              <span className="font-medium">{(summary?.difficultyStale || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total MH</span>
              <span className="font-medium">{(summary?.totalMh || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
