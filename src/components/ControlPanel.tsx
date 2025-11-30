import { useState } from 'react';
import { RefreshCw, Power, RotateCcw, Settings } from 'lucide-react';
import { cgminerAPI } from '../services/cgminer';

interface ControlPanelProps {
  onRefresh: () => void;
}

export function ControlPanel({ onRefresh }: ControlPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleRestart = async () => {
    if (!confirm('Are you sure you want to restart the miner?')) return;

    setLoading('restart');
    try {
      await cgminerAPI.restart();
      setTimeout(onRefresh, 3000);
    } catch (error) {
      alert('Failed to restart miner');
    } finally {
      setLoading(null);
    }
  };

  const handleStop = async () => {
    if (!confirm('Are you sure you want to stop the miner? You will need to manually restart CGMiner.')) return;

    setLoading('stop');
    try {
      await cgminerAPI.quit();
    } catch (error) {
      alert('Failed to stop miner');
    } finally {
      setLoading(null);
    }
  };

  const handleRefresh = () => {
    setLoading('refresh');
    onRefresh();
    setTimeout(() => setLoading(null), 500);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Settings className="w-4 h-4" />
        Miner Controls
      </h3>

      <div className="space-y-3">
        <button
          onClick={handleRefresh}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${loading === 'refresh' ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>

        <button
          onClick={handleRestart}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className={`w-4 h-4 ${loading === 'restart' ? 'animate-spin' : ''}`} />
          Restart Miner
        </button>

        <button
          onClick={handleStop}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Power className="w-4 h-4" />
          Stop Miner
        </button>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-xs font-semibold text-gray-700 mb-3">System Info</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Refresh Rate</span>
            <span className="font-medium">5 seconds</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">API Status</span>
            <span className="font-medium text-green-600">Connected</span>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> This dashboard connects to CGMiner's API. Make sure CGMiner is running with API access enabled.
        </p>
      </div>
    </div>
  );
}
