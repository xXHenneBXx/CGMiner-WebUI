import { Cpu, Thermometer, Activity, AlertCircle } from 'lucide-react';
import { DeviceInfo } from '../types/miner';

interface DeviceCardProps {
  device: DeviceInfo;
}

export function DeviceCard({ device }: DeviceCardProps) {
  const getStatusColor = (status: string) => {
    return status.toLowerCase() === 'alive' ? 'bg-green-500' : 'bg-red-500';
  };

  const getTempColor = (temp: number) => {
    if (temp > 80) return 'text-red-600';
    if (temp > 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{device.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(device.status)}`}></div>
              <span className="text-sm text-gray-600">{device.status}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getTempColor(device.temperature)}`}>
            {device.temperature.toFixed(1)}°C
          </div>
          <div className="text-xs text-gray-500 mt-1">Temperature</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-600">Hashrate</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{device.hashrate.toFixed(2)}</div>
          <div className="text-xs text-gray-500">MH/s</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Thermometer className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-gray-600">Frequency</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{device.frequency}</div>
          <div className="text-xs text-gray-500">MHz</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div>
          <div className="text-xs text-gray-600 mb-1">Accepted</div>
          <div className="text-sm font-semibold text-green-600">{device.accepted}</div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Rejected</div>
          <div className="text-sm font-semibold text-red-600">{device.rejected}</div>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <AlertCircle className="w-3 h-3 text-gray-600" />
            <div className="text-xs text-gray-600">HW Errors</div>
          </div>
          <div className="text-sm font-semibold text-orange-600">{device.hardwareErrors}</div>
        </div>
      </div>
    </div>
  );
}
