import { useState, useEffect } from 'react';
import { Plus, Trash2, Power, PowerOff, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { cgminerAPI } from '../services/cgminer';
import { PoolInfo } from '../types/miner';

export function SettingsPage() {
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ url: '', user: '', pass: '' });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPools = async () => {
    setLoading(true);
    const poolsData = await cgminerAPI.getPools();
    setPools(poolsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchPools();
    const interval = setInterval(fetchPools, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddPool = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('add');

    const success = await cgminerAPI.addPool(formData.url, formData.user, formData.pass);

    if (success) {
      setFormData({ url: '', user: '', pass: '' });
      setShowAddForm(false);
      setTimeout(fetchPools, 1000);
    } else {
      alert('Failed to add pool');
    }

    setActionLoading(null);
  };

  const handleRemovePool = async (poolId: number) => {
    if (!confirm('Are you sure you want to remove this pool?')) return;

    setActionLoading(`remove-${poolId}`);
    const success = await cgminerAPI.removePool(poolId);

    if (success) {
      setTimeout(fetchPools, 1000);
    } else {
      alert('Failed to remove pool');
    }

    setActionLoading(null);
  };

  const handleEnablePool = async (poolId: number) => {
    setActionLoading(`enable-${poolId}`);
    const success = await cgminerAPI.enablePool(poolId);

    if (success) {
      setTimeout(fetchPools, 1000);
    } else {
      alert('Failed to enable pool');
    }

    setActionLoading(null);
  };

  const handleDisablePool = async (poolId: number) => {
    setActionLoading(`disable-${poolId}`);
    const success = await cgminerAPI.disablePool(poolId);

    if (success) {
      setTimeout(fetchPools, 1000);
    } else {
      alert('Failed to disable pool');
    }

    setActionLoading(null);
  };

  const handleMovePriority = async (poolId: number, direction: 'up' | 'down') => {
    const currentIndex = pools.findIndex(p => p.priority === poolId);
    if (currentIndex === -1) return;

    const newPools = [...pools];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= pools.length) return;

    [newPools[currentIndex], newPools[targetIndex]] = [newPools[targetIndex], newPools[currentIndex]];

    const priorities = newPools.map((_, idx) => idx);

    setActionLoading('priority');
    const success = await cgminerAPI.setPoolPriority(priorities);

    if (success) {
      setTimeout(fetchPools, 1000);
    } else {
      alert('Failed to change pool priority');
    }

    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Mining Pools</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your mining pool connections and failover settings</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchPools}
            disabled={actionLoading !== null}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Pool
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Pool</h3>
          <form onSubmit={handleAddPool} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pool URL
              </label>
              <input
                type="text"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="stratum+tcp://pool.example.com:3333"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={formData.user}
                onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                placeholder="your_wallet_address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={formData.pass}
                onChange={(e) => setFormData({ ...formData, pass: e.target.value })}
                placeholder="x"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={actionLoading !== null}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'add' ? 'Adding...' : 'Add Pool'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {pools.map((pool, index) => {
          const isActive = pool.status.toLowerCase().includes('alive');

          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <h3 className="font-semibold text-gray-900 truncate">{pool.url}</h3>
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      Priority: {pool.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{pool.user}</p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleMovePriority(pool.priority, 'up')}
                    disabled={index === 0 || actionLoading !== null}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                    title="Increase priority"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMovePriority(pool.priority, 'down')}
                    disabled={index === pools.length - 1 || actionLoading !== null}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                    title="Decrease priority"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  {isActive ? (
                    <button
                      onClick={() => handleDisablePool(pool.priority)}
                      disabled={actionLoading !== null}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded disabled:opacity-50"
                      title="Disable pool"
                    >
                      <PowerOff className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEnablePool(pool.priority)}
                      disabled={actionLoading !== null}
                      className="p-2 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                      title="Enable pool"
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleRemovePool(pool.priority)}
                    disabled={actionLoading !== null}
                    className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                    title="Remove pool"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
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
                <div>
                  <div className="text-xs text-gray-600 mb-1">Status</div>
                  <div className={`text-sm font-semibold ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {pool.status}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {pools.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">No pools configured. Add a pool to get started.</p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">About Pool Failover</h4>
        <p className="text-sm text-blue-800">
          CGMiner automatically switches to backup pools if the primary pool becomes unavailable.
          Pools are tried in order of priority (0 is highest). Configure multiple pools to ensure
          continuous mining operation.
        </p>
      </div>
    </div>
  );
}
