import { Server, CheckCircle, XCircle, Clock } from 'lucide-react';
import { PoolInfo } from '../types/miner';

interface PoolCardProps {
  pool: PoolInfo;
}

export function PoolCard({ pool }: PoolCardProps) {
  const isActive = pool.status.toLowerCase().includes('alive');

  const formatLastShare = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            <Server className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{pool.url}</h3>
            <p className="text-sm text-gray-600 truncate">{pool.user}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {isActive ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <span className={`text-sm font-medium ${isActive ? 'text-green-600' : 'text-red-600'}`}>
            {pool.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        <div>
          <div className="text-xs text-gray-600 mb-1">Priority</div>
          <div className="text-sm font-semibold text-gray-900">{pool.priority}</div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Accepted</div>
          <div className="text-sm font-semibold text-green-600">{pool.accepted}</div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Rejected</div>
          <div className="text-sm font-semibold text-red-600">{pool.rejected}</div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Stale</div>
          <div className="text-sm font-semibold text-yellow-600">{pool.stale}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
        <Clock className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-600">
          Last share: <span className="font-medium">{formatLastShare(pool.lastShareTime)}</span>
        </span>
      </div>
    </div>
  );
}
