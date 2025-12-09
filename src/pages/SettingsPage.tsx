import { useState, useEffect } from 'react';
import { Plus, Trash2, Power, PowerOff, ArrowUp, ArrowDown, RefreshCw, AlertCircle, CheckCircle, Info, Wifi, WifiOff, Repeat } from 'lucide-react';
import { cgminerAPI } from '../services/cgminer';
import { PoolInfo } from '../types/miner';

interface Message { type: 'success' | 'error' | 'info'; text: string; timestamp: number; }
interface MinerDevice { id: string; name: string; status: 'online' | 'offline'; }

export function SettingsPage() {
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ url: '', user: '', pass: '' });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    const newMessage: Message = { type, text, timestamp: Date.now() };
    setMessages(prev => [...prev, newMessage]);
    setTimeout(() => setMessages(prev => prev.filter(m => m.timestamp !== newMessage.timestamp)), 5000);
  };

  const fetchPools = async () => {
    try {
      setLoading(true);
      const poolsData = await cgminerAPI.getPools();
      const poolsWithId = (poolsData || []).map((p: any, idx: number) => ({ ...p, id: typeof p.id === 'number' ? p.id : idx }));
      setPools(poolsWithId);
      setLoading(false);
    } catch (error) {
      showMessage('error', 'Failed to fetch pools: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setLoading(false);
    }
  };

  useEffect(() => { fetchPools(); }, []);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    if (!formData.url.trim()) errors.url = 'Pool URL is required';
    else if (!formData.url.includes(':')) errors.url = 'URL must include port';
    if (!formData.user.trim()) errors.user = 'Username/wallet address is required';
    if (!formData.pass.trim()) errors.pass = 'Password is required (use "x" if not needed)';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddPool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) { showMessage('error', 'Please fix form errors before submitting'); return; }
    setActionLoading('add');
    try {
      const success = await cgminerAPI.addPool(formData.url, formData.user, formData.pass);
      if (success) {
        showMessage('success', `Pool added successfully: ${formData.url}`);
        setFormData({ url: '', user: '', pass: '' });
        setFormErrors({});
        setShowAddForm(false);
        setTimeout(fetchPools, 1000);
      } else showMessage('error', 'Failed to add pool. Check URL format.');
    } catch (error) {
      showMessage('error', 'Error adding pool: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    setActionLoading(null);
  };

  const handleRemovePool = async (poolPriority: number, poolUrl: string) => {
    if (!confirm(`⚠️ Remove pool "${poolUrl}"?`)) return;
    setActionLoading(`remove-${poolPriority}`);
    try {
      const success = await cgminerAPI.removePool(poolPriority);
      success ? showMessage('success', `Pool removed: ${poolUrl}`) : showMessage('error', 'Failed to remove pool');
      setTimeout(fetchPools, 1000);
    } catch (error) { showMessage('error', 'Error removing pool: ' + (error instanceof Error ? error.message : 'Unknown error')); }
    setActionLoading(null);
  };

  const handleEnablePool = async (poolPriority: number, poolUrl: string) => {
    setActionLoading(`enable-${poolPriority}`);
    try {
      const success = await cgminerAPI.enablePool(poolPriority);
      success ? showMessage('success', `Pool enabled: ${poolUrl}`) : showMessage('error', 'Failed to enable pool');
      setTimeout(fetchPools, 1000);
    } catch (error) { showMessage('error', 'Error enabling pool: ' + (error instanceof Error ? error.message : 'Unknown error')); }
    setActionLoading(null);
  };

  const handleDisablePool = async (poolPriority: number, poolUrl: string) => {
    const activePoolsCount = pools.filter(p => p.status.toLowerCase().includes('alive')).length;
    if (activePoolsCount <= 1) { showMessage('error', 'Cannot disable the only active pool!'); return; }
    setActionLoading(`disable-${poolPriority}`);
    try {
      const success = await cgminerAPI.disablePool(poolPriority);
      success ? showMessage('success', `Pool disabled: ${poolUrl}`) : showMessage('error', 'Failed to disable pool');
      setTimeout(fetchPools, 1000);
    } catch (error) { showMessage('error', 'Error disabling pool: ' + (error instanceof Error ? error.message : 'Unknown error')); }
    setActionLoading(null);
  };

  const handleSwitchPool = async (poolPriority: number, poolUrl: string) => {
    if (!confirm(`🔄 Switch to pool "${poolUrl}"?`)) return;
    setActionLoading(`switch-${poolPriority}`);
    try {
      const success = await cgminerAPI.switchPool(poolPriority);
      success ? showMessage('success', `Switched to pool: ${poolUrl}`) : showMessage('error', 'Failed to switch pool');
      setTimeout(fetchPools, 1000);
    } catch (error) { showMessage('error', 'Error switching pool: ' + (error instanceof Error ? error.message : 'Unknown error')); }
    setActionLoading(null);
  };

  const handleMovePriority = async (currentPriority: number, direction: 'up' | 'down') => {
    if (!pools || pools.length === 0) return;
    const sortedPools = [...pools].sort((a, b) => a.priority - b.priority);
    const currentIndex = sortedPools.findIndex((p) => p.priority === currentPriority);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedPools.length) return;
    [sortedPools[currentIndex], sortedPools[targetIndex]] = [sortedPools[targetIndex], sortedPools[currentIndex]];
    sortedPools.forEach((pool, index) => (pool.priority = index));
    setPools(sortedPools);
    const newPoolOrder = sortedPools.map((pool, i) => (typeof pool.id === 'number' ? pool.id : pool.priority));
    setActionLoading(`priority-${currentPriority}`);
    try {
      const success = await cgminerAPI.setPoolPriority(newPoolOrder);
      success ? showMessage('info', `Pool priority ${direction === 'up' ? 'increased' : 'decreased'}`) : fetchPools();
    } catch (error) { showMessage('error', 'Error changing priority: ' + (error instanceof Error ? error.message : 'Unknown error')); fetchPools(); }
    setActionLoading(null);
  };

  const getAcceptanceRate = (pool: PoolInfo) => { const total = pool.accepted + pool.rejected; return total > 0 ? (pool.accepted / total) * 100 : 0; };
  const sortedPools = [...pools].sort((a, b) => a.priority - b.priority);

  if (loading) return <div className="flex items-center justify-center py-12"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div><p className="mt-4 text-gray-600">Loading pool configuration...</p></div></div>;

  return (
    <div className="space-y-6">
      {/* Messages */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {messages.map((message) => (
          <div key={message.timestamp} className={`p-3 rounded-lg shadow-lg flex items-start gap-2 animate-in slide-in-from-right ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : message.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <Info className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-blue-600">Mining Pool Configuration</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your mining pool connections and failover settings</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchPools} disabled={actionLoading !== null} className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> {showAddForm ? 'Cancel' : 'Add Pool'}
          </button>
        </div>
      </div>

      {/* Add Pool Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-4 border-2 border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Add New Mining Pool</h3>
          <form onSubmit={handleAddPool} className="space-y-2">
            {['url','user','pass'].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700">{field === 'url' ? 'Pool URL' : field === 'user' ? 'Username / Wallet' : 'Password'} <span className="text-red-500">*</span></label>
                <input type="text" value={formData[field as keyof typeof formData]} onChange={(e)=>{setFormData({...formData,[field]:e.target.value}); setFormErrors({...formErrors,[field]:''})}} placeholder={field==='url'?'stratum+tcp://pool.com:3333':field==='user'?'wallet.worker':'x'} className={`w-full px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors[field]?'border-red-500':'border-gray-300'}`} required />
                {formErrors[field] && <p className="text-xs text-red-600 mt-1">{formErrors[field]}</p>}
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={actionLoading!==null} className="flex-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium">{actionLoading==='add'?<span className="flex items-center justify-center gap-1"><RefreshCw className="w-4 h-4 animate-spin"/> Adding...</span>:'Add Pool'}</button>
              <button type="button" onClick={()=>{setShowAddForm(false); setFormErrors({})}} className="flex-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Pools List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Configured Pools ({pools.length})</h3>
          <span className="text-sm text-gray-500">{pools.filter(p=>p.status.toLowerCase().includes('alive')).length} active</span>
        </div>

        {sortedPools.map((pool, i)=>{const isActive=pool.status.toLowerCase().includes('alive'); const acceptanceRate=getAcceptanceRate(pool);
          return(
            <div key={pool.priority} className={`bg-white rounded-lg shadow-md p-3 hover:shadow-lg transition-all ${isActive?'border-l-4 border-green-500':'border-l-4 border-gray-300'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {isActive?<Wifi className="w-5 h-5 text-green-500 flex-shrink-0"/>:<WifiOff className="w-5 h-5 text-gray-400 flex-shrink-0"/>}
                    <h3 className="font-semibold text-gray-900 truncate">{pool.url}</h3>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${pool.priority===0?'bg-blue-100 text-blue-800':'bg-gray-100 text-gray-700'}`}>{pool.priority===0?'PRIMARY':`Priority ${pool.priority}`}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate ml-6">{pool.user}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button onClick={()=>handleMovePriority(pool.priority,'up')} disabled={i===0||actionLoading!==null} className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed" title="Increase priority"><ArrowUp className="w-4 h-4"/></button>
                  <button onClick={()=>handleMovePriority(pool.priority,'down')} disabled={i===sortedPools.length-1||actionLoading!==null} className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed" title="Decrease priority"><ArrowDown className="w-4 h-4"/></button>
                  <button onClick={()=>handleSwitchPool(pool.priority,pool.url)} disabled={actionLoading!==null||pool.priority===0} className="p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30 disabled:cursor-not-allowed" title={pool.priority===0?"Already primary":"Switch to this pool"}>{actionLoading===`switch-${pool.priority}`?<RefreshCw className="w-4 h-4 animate-spin"/>:<Repeat className="w-4 h-4"/>}</button>
                  {isActive?<button onClick={()=>handleDisablePool(pool.priority,pool.url)} disabled={actionLoading!==null} className="p-1 text-orange-600 hover:bg-orange-50 rounded disabled:opacity-50" title="Disable pool">{actionLoading===`disable-${pool.priority}`?<RefreshCw className="w-4 h-4 animate-spin"/>:<PowerOff className="w-4 h-4"/>}</button>:<button onClick={()=>handleEnablePool(pool.priority,pool.url)} disabled={actionLoading!==null} className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50" title="Enable pool">{actionLoading===`enable-${pool.priority}`?<RefreshCw className="w-4 h-4 animate-spin"/>:<Power className="w-4 h-4"/>}</button>}
                  <button onClick={()=>handleRemovePool(pool.priority,pool.url)} disabled={actionLoading!==null} className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50" title="Remove pool">{actionLoading===`remove-${pool.priority}`?<RefreshCw className="w-4 h-4 animate-spin"/>:<Trash2 className="w-4 h-4"/>}</button>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 pt-2 border-t border-gray-200 text-xs">
                <div><div>Accepted</div><div className="font-semibold text-green-600">{pool.accepted.toLocaleString()}</div></div>
                <div><div>Rejected</div><div className="font-semibold text-red-600">{pool.rejected.toLocaleString()}</div></div>
                <div><div>Stale</div><div className="font-semibold text-yellow-600">{pool.stale.toLocaleString()}</div></div>
                <div><div>Accept Rate</div><div className={`font-semibold ${acceptanceRate>=99?'text-green-600':acceptanceRate>=95?'text-yellow-600':'text-red-600'}`}>{acceptanceRate.toFixed(2)}%</div></div>
                <div><div>Status</div><div className={`font-semibold ${isActive?'text-green-600':'text-red-600'}`}>{pool.status}</div></div>
              </div>
            </div>
          );
        })}

        {pools.length===0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Wifi className="w-16 h-16 mx-auto mb-2 text-gray-400"/>
            <p className="text-gray-500 font-medium">No pools configured</p>
            <p className="text-sm text-gray-400">Add a pool to start mining</p>
            <button onClick={()=>setShowAddForm(true)} className="mt-2 px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Add Your First Pool</button>
          </div>
        )}
      </div>

      {/* Info Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex gap-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5"/>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Pool Failover System</h4>
              <p className="text-sm text-blue-800">CGMiner automatically switches to backup pools if the primary pool fails. Pools are tried in priority order (0 is highest). Configure multiple pools for uninterrupted mining.</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5"/>
            <div>
              <h4 className="font-semibold text-green-900 mb-1">Best Practices</h4>
              <ul className="text-sm text-green-800 space-y-0.5">
                <li>• Always configure at least 2-3 backup pools</li>
                <li>• Test pools before adding to production</li>
                <li>• Monitor acceptance rates (&gt;99%)</li>
                <li>• Use pools geographically close to you</li>
                <li>• Use "Switch Pool" for immediate failover testing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
