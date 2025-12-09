import { Cpu, Thermometer, Zap, Activity, AlertCircle, Fan } from 'lucide-react';
import { DeviceInfo, DeviceDetails, RawStatsInfo } from '../types/miner';

interface DeviceCardProps {
  device: DeviceInfo & DeviceDetails & RawStatsInfo;
}
    // ---------------------- Formatting helpers ----------------------
  const formatHashrate = (hashrate: number) => {
    if (!hashrate) return '0 MH/s';
    if (hashrate < 1_000) return `${hashrate.toFixed(2)} MH/s`;
    if (hashrate < 1_000_000) return `${(hashrate / 1_000).toFixed(2)} GH/s`;
    if (hashrate < 1_000_000_000) return `${(hashrate / 1_000_000).toFixed(2)} TH/s`;
    return `${(hashrate / 1_000_000_000).toFixed(2)} PH/s`;
  };

export function DeviceCard({ device }: DeviceCardProps) {
  const getStatusColor = (status?: string) =>
    status?.toLowerCase() === 'alive' ? 'bg-green-500' : 'bg-red-500';

  const getTempColor = (temp?: number) => {
    if (!temp) return 'text-gray-500';
    if (temp > 80) return 'text-red-600';
    if (temp > 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
            <Cpu className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">
              {device.name}
              {device.serial ? ` (#${device.serial})` : ''}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(device.status)}`} />
              <span className="text-sm text-gray-600">
                {device.status ?? 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className={`flex items-center gap-1 text-2xl font-bold ${getTempColor(device.temperature)}`}>
            <Thermometer className="w-4 h-4 text-orange-500" />
            {device.temperature !== undefined ? device.temperature.toFixed(1) : '--'}°C
          </div>
          <div className="text-xs text-gray-500 mt-1">Temperature</div>
        </div>
      </div>

      {/* Main stats grid */}
      <div className="grid grid-cols-2 gap-1 mb-4">
        {/* Hashrate */}
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-600">Hashrate</span>
          </div>
          <div className="text-lg font-bold text-green-400">
            {formatHashrate(device.hashrate !== undefined ? device.hashrate : '--')}
          </div>
        </div>

        {/* Frequency */}
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-red-600" />
            <span className="text-xs text-gray-600">Frequency</span>
          </div>
          <div className="text-lg font-bold text-yellow-400">
            {device.frequency ?? '--'}
          </div>
          <div className="text-xs text-gray-500">MHz</div>
        </div>

        {/* Chips */}
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-600">Chip Count</span>
          </div>
          <div className="text-lg font-bold text-blue-700">
            {device.chips ?? '--'}
          </div>
        </div>

        {/* Fan */}
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="flex items-center gap-2 mb-1">
            <Fan className="w-4 h-4 text-cyan-500" />
            <span className="text-xs text-gray-600">Fan Speed</span>
          </div>
          <div className="text-lg font-bold text-cyan-400">
            {device.fanSpeed ?? '--'}
          </div>
          <div className="text-xs text-gray-500">RPM</div>
        </div>

        {/* Voltage */}
        <div className="bg-gray-50 rounded-lg p-2 col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-gray-600">Voltage</span>
          </div>
          <div className="text-lg font-bold text-purple-500">
            {device.voltage !== undefined ? (device.voltage / 1000).toFixed(2) : '--'}
          </div>
          <div className="text-xs text-gray-500">Mv/V</div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div>
          <div className="text-xs text-gray-600 mb-1">Accepted</div>
          <div className="text-sm font-semibold text-green-600">
            {device.accepted ?? 0}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-600 mb-1">Rejected</div>
          <div className="text-sm font-semibold text-red-600">
            {device.rejected ?? 0}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1">
            <AlertCircle className="w-3 h-3 text-gray-600" />
            <div className="text-xs text-gray-600">HW Errors</div>
          </div>
          <div className="text-sm font-semibold text-orange-600">
            {device.hardwareErrors ?? 0}
          </div>
        </div>
      </div>
    </div>
  );
}
