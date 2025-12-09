import { useState, useEffect } from 'react';
import { Sliders, Zap, Power, PowerOff, Save, RefreshCw, RotateCcw, Activity, AlertCircle, CheckCircle, Info, Gauge, Fan } from 'lucide-react';
import { cgminerAPI } from '../services/cgminer';
import { DeviceInfo, RawStatsInfo } from '../types/miner';

interface MergedDeviceInfo extends DeviceInfo {
  serial?: string;
  frequency?: number;
  chips?: number;
  voltage?: number;
  fanSpeed?: number;
  rolling?: number;
  enabled?: string;
}

interface Message {
  type: 'success' | 'error' | 'info';
  text: string;
  timestamp: number;
}

export function ConfigurationPage() {
  const [devices, setDevices] = useState<MergedDeviceInfo[]>([]);
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [frequencyInputs, setFrequencyInputs] = useState<{ [key: number]: string }>({});
  const [voltageInputs, setVoltageInputs] = useState<{ [key: number]: string }>({});
  const [fanInputs, setFanInputs] = useState<{ [key: number]: string }>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [hotplugSeconds, setHotplugSeconds] = useState<string>('5');

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    const newMessage: Message = { type, text, timestamp: Date.now() };
    setMessages(prev => [...prev, newMessage]);
    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.timestamp !== newMessage.timestamp));
    }, 5000);
  };

  const mergeDeviceData = (devicesData: any[], statsRaw: RawStatsInfo[]): MergedDeviceInfo[] => {
    return devicesData
      .filter((dev: any) => dev.Enabled === 'Y' && !dev['No Device'])
      .map((dev: any) => {
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
          enabled: dev.Enabled || 'Y',
          serial: matchingStat?.Serial || undefined,
          frequency: matchingStat?.Frequency || matchingStat?.FreqSel || 0,
          chips: matchingStat?.Chips || 0,
          voltage: matchingStat?.Voltage || 0,
          fanSpeed: matchingStat?.FanSpeed || matchingStat?.['Fan Speed'] || 0,
          rolling: matchingStat?.Rolling || 0,
        };
      });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [devicesData, rawDevices, configData, statsRawData] = await Promise.all([
        cgminerAPI.getDevices(),
        fetch(`http://${window.location.hostname}:3001/api/devices`).then(r => r.json()),
        cgminerAPI.getConfig(),
        cgminerAPI.getStatsRaw(),
      ]);

      const mergedDevices = mergeDeviceData(rawDevices, statsRawData);
      setDevices(mergedDevices);
      setConfig(configData);

      const initialVolts: { [key: number]: string } = {};
      const initialFans: { [key: number]: string } = {};
      const initialFreqs: { [key: number]: string } = {};

      mergedDevices.forEach(dev => {
        initialFreqs[dev.id] = dev.frequency?.toString() || 'N/A';
        initialVolts[dev.id] = dev.voltage ? (dev.voltage / 1000).toFixed(2) : '';
        initialFans[dev.id] = '';
      });

      setFrequencyInputs(initialFreqs);
      setVoltageInputs(initialVolts);
      setFanInputs(initialFans);
      setLoading(false);
    } catch (error) {
      showMessage('error', 'Failed to fetch device data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEnableDevice = async (deviceId: number) => {
    setActionLoading(`enable-${deviceId}`);
    try {
      const success = await cgminerAPI.enableDevice(deviceId);
      if (success) {
        showMessage('success', `Device ${deviceId} enabled`);
        setTimeout(fetchData, 1000);
      } else showMessage('error', `Failed to enable device`);
    } catch {
      showMessage('error', 'Error enabling device');
    }
    setActionLoading(null);
  };

  const handleDisableDevice = async (deviceId: number) => {
    if (!confirm('Disable device?')) return;
    setActionLoading(`disable-${deviceId}`);
    try {
      const success = await cgminerAPI.disableDevice(deviceId);
      if (success) {
        showMessage('success', `Device ${deviceId} disabled`);
        setTimeout(fetchData, 1000);
      } else showMessage('error', `Failed to disable device`);
    } catch {
      showMessage('error', 'Error disabling device');
    }
    setActionLoading(null);
  };

  const handleSetVoltage = async (deviceId: number) => {
    const voltage = parseFloat(voltageInputs[deviceId]);
    if (isNaN(voltage)) return showMessage('error', 'Invalid voltage');
    if (!confirm(`Set ${voltage}V?`)) return;

    setActionLoading(`volt-${deviceId}`);
    try {
      const mv = Math.round(voltage * 1000);
      const success = await cgminerAPI.setDeviceOption(deviceId, 'millivolts', mv);
      if (success) {
        showMessage('success', `Voltage updated`);
        setTimeout(fetchData, 1500);
      } else showMessage('error', 'Failed to set voltage');
    } catch {
      showMessage('error', 'Voltage error');
    }
    setActionLoading(null);
  };

  const handleSetFanSpeed = async (deviceId: number) => {
    const speed = parseInt(fanInputs[deviceId]);
    if (isNaN(speed) || speed < 0 || speed > 100) return alert('Invalid fan speed');

    setActionLoading(`fan-${deviceId}`);
    const success = await cgminerAPI.setDeviceOption(deviceId, 'fan', speed);
    if (success) fetchData();
    setActionLoading(null);
  };

  const handleSetFrequency = async (deviceId: number) => {
    const freq = parseInt(frequencyInputs[deviceId]);
    if (isNaN(freq) || freq < 100 || freq > 800)
      return showMessage('error', 'Invalid frequency');

    if (!confirm(`Set ${freq} MHz?`)) return;

    setActionLoading(`freq-${deviceId}`);
    try {
      const success = await cgminerAPI.setDeviceFrequency(deviceId, freq);
      if (success) {
        showMessage('success', `Frequency updated`);
        setTimeout(fetchData, 1500);
      } else showMessage('error', 'Failed to set frequency');
    } catch {
      showMessage('error', 'Frequency error');
    }
    setActionLoading(null);
  };

  const handleConfigChange = async (name: string, value: string) => {
    const num = parseInt(value);
    if (isNaN(num)) return showMessage('error', 'Invalid number');

    setActionLoading(`config-${name}`);
    const success = await cgminerAPI.setConfig(name, num);
    if (success) {
      showMessage('success', `${name} updated`);
      setTimeout(fetchData, 1000);
    } else showMessage('error', `Failed to update ${name}`);
    setActionLoading(null);
  };

  const handleHotplug = async () => {
    const seconds = parseInt(hotplugSeconds);
    if (isNaN(seconds)) return showMessage('error', 'Invalid number');

    setActionLoading('hotplug');
    const success = await cgminerAPI.setHotplug(seconds);
    if (success) {
      showMessage('success', `Hotplug updated`);
      setTimeout(fetchData, 1000);
    }
    setActionLoading(null);
  };

  const formatHashrate = (h: number) => {
    if (!h) return '0 MH/s';
    if (h < 1000) return `${h.toFixed(2)} MH/s`;
    if (h < 1_000_000) return `${(h / 1000).toFixed(2)} GH/s`;
    return `${(h / 1_000_000).toFixed(2)} TH/s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center md:py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      <div className="flex top-4 right-4 z-50 space-y-2 max-w-md">
        {messages.map((message) => (
          <div
            key={message.timestamp}
            className={`p-4 rounded-lg shadow-lg flex items-start gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : message.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-blue-600">Device Configuration</h2>
        </div>
        <button
          onClick={fetchData}
          disabled={actionLoading !== null}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Devices List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-gray-400">Active Devices ({devices.length})</h3>

          {devices.map((device) => {
            const isAlive = device.status.toLowerCase() === 'alive';
            const isEnabled = device.enabled === 'Y';

            return (
              <div key={device.id} className="bg-white rounded-lg shadow-md p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isAlive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        {device.name} #{device.id}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${isAlive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-sm text-gray-600">{device.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isEnabled ? (
                      <button onClick={() => handleDisableDevice(device.id)} className="p-2 text-orange-600 hover:bg-orange-50 rounded">
                        {actionLoading === `disable-${device.id}` ? <RefreshCw className="w-5 h-5 animate-spin" /> : <PowerOff className="w-5 h-5" />}
                      </button>
                    ) : (
                      <button onClick={() => handleEnableDevice(device.id)} className="p-2 text-green-600 hover:bg-green-50 rounded">
                        {actionLoading === `enable-${device.id}` ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Power className="w-5 h-5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b">
                  <div>
                    <div className="text-xs text-gray-600">Hashrate</div>
                    <div className="text-lg font-bold text-green-600">{formatHashrate(device.hashrate)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Temperature</div>
                    <div className="text-lg font-bold">{device.temperature}°C</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Frequency</div>
                    <div className="text-lg font-bold text-blue-600">{device.frequency} MHz</div>
                  </div>
                </div>

                {/* Voltage & Fan */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {/* Voltage */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-semibold">Voltage (V)</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={voltageInputs[device.id] || ''}
                        onChange={(e) => setVoltageInputs({ ...voltageInputs, [device.id]: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                      <button onClick={() => handleSetVoltage(device.id)} className="px-2 py-1 bg-purple-600 text-white rounded">
                        {actionLoading === `volt-${device.id}` ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Set'}
                      </button>
                    </div>
                  </div>

                  {/* Fan */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Fan className="w-4 h-4 text-cyan-600" />
                      <span className="text-xs font-semibold">Fan (%)</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={fanInputs[device.id] || ''}
                        onChange={(e) => setFanInputs({ ...fanInputs, [device.id]: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                      <button onClick={() => handleSetFanSpeed(device.id)} className="px-2 py-1 bg-cyan-600 text-white rounded">
                        {actionLoading === `fan-${device.id}` ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Set'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Frequency */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold">Adjust Frequency</span>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      min="100"
                      max="800"
                      step="50"
                      value={frequencyInputs[device.id] || ''}
                      onChange={(e) => setFrequencyInputs({ ...frequencyInputs, [device.id]: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                    <button onClick={() => handleSetFrequency(device.id)} className="px-6 py-2 bg-blue-600 text-white rounded">
                      {actionLoading === `freq-${device.id}` ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-gray-600">Accepted</div>
                    <div className="font-semibold text-green-600">{device.accepted}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Rejected</div>
                    <div className="font-semibold text-red-600">{device.rejected}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">HW Errors</div>
                    <div className="font-semibold text-orange-600">{device.hardwareErrors}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
		<div className="space-y-4">
		  {/* Global Settings */}
		  <div className="bg-white rounded-lg shadow-md p-6">
			<div className="flex items-center gap-2 mb-4">
			  <Sliders className="w-5 h-5 text-gray-700" />
			  <h3 className="text-lg font-semibold text-gray-900">Global Settings</h3>
			</div>

			<div className="space-y-4">
			  {/* Queue Size */}
			  <div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
				  Queue Size
				</label>
				<div className="flex gap-2">
				  <input
					type="number"
					defaultValue={config.queue || 1}
					className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					id="queue-input"
				  />
				  <button
					onClick={() => {
					  const input = document.getElementById('queue-input') as HTMLInputElement;
					  handleConfigChange('queue', input.value);
					}}
					disabled={actionLoading !== null}
					className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
				  >
					<Save className="w-4 h-4" />
				  </button>
				</div>
				<p className="text-xs text-gray-500 mt-1">Work queue size (0-9999)</p>
			  </div>

			  {/* Scan Time */}
			  <div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
				  Scan Time (seconds)
				</label>
				<div className="flex gap-2">
				  <input
					type="number"
					defaultValue={config.scantime || 60}
					className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					id="scantime-input"
				  />
				  <button
					onClick={() => {
					  const input = document.getElementById('scantime-input') as HTMLInputElement;
					  handleConfigChange('scantime', input.value);
					}}
					disabled={actionLoading !== null}
					className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
				  >
					<Save className="w-4 h-4" />
				  </button>
				</div>
				<p className="text-xs text-gray-500 mt-1">Time to scan current work (1-9999)</p>
			  </div>

			  {/* Expiry Time */}
			  <div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
				  Expiry Time (seconds)
				</label>
				<div className="flex gap-2">
				  <input
					type="number"
					defaultValue={config.expiry || 120}
					className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					id="expiry-input"
				  />
				  <button
					onClick={() => {
					  const input = document.getElementById('expiry-input') as HTMLInputElement;
					  handleConfigChange('expiry', input.value);
					}}
					disabled={actionLoading !== null}
					className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
				  >
					<Save className="w-4 h-4" />
				  </button>
				</div>
				<p className="text-xs text-gray-500 mt-1">Work expiry time (0-9999)</p>
			  </div>

			  {/* Log Interval */}
			  <div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
				  Log Interval (seconds)
				</label>
				<div className="flex gap-2">
				  <input
					type="number"
					defaultValue={config.logInterval || 5}
					min="1"
					max="999"
					className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					id="log-interval-input"
				  />
				  <button
					onClick={() => {
					  const input = document.getElementById('log-interval-input') as HTMLInputElement;
					  handleConfigChange('log', input.value);
					}}
					disabled={actionLoading !== null}
					className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
				  >
					<Save className="w-4 h-4" />
				  </button>
				</div>
				<p className="text-xs text-gray-500 mt-1">How often to log statistics (1-999)</p>
			  </div>
			</div>
		  </div>

		  {/* Hotplug Control */}
		  <div className="bg-white rounded-lg shadow-md p-6">
			<div className="flex items-center gap-2 mb-4">
			  <RotateCcw className="w-5 h-5 text-gray-700" />
			  <h3 className="text-lg font-semibold text-gray-900">Hotplug Control</h3>
			</div>
			<div className="space-y-3">
			  <p className="text-sm text-gray-600">
				Enable automatic device detection every N seconds (0 to disable)
			  </p>
			  <div className="flex gap-2">
				<input
				  type="number"
				  min="0"
				  max="9999"
				  value={hotplugSeconds}
				  onChange={(e) => setHotplugSeconds(e.target.value)}
				  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
				  placeholder="Seconds (0-9999)"
				/>
				<button
				  onClick={handleHotplug}
				  disabled={actionLoading !== null}
				  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
				>
				  {actionLoading === 'hotplug' ? (
					<RefreshCw className="w-5 h-5 animate-spin" />
				  ) : (
					'Apply'
				  )}
				</button>
			  </div>
			  <p className="text-xs text-gray-500">Current: {config.hotplug || 0} seconds</p>
			</div>
		  </div>

		  {/* Warning Notice */}
		  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
			<div className="flex gap-2">
			  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
			  <div>
				<h4 className="font-semibold text-yellow-900 mb-1">⚠️ Important</h4>
				<ul className="text-xs text-yellow-800 space-y-1">
				  <li>• Changing frequency affects hashrate and power consumption</li>
				  <li>• Monitor temperature closely after frequency changes</li>
				  <li>• Hardware damage possible with aggressive settings</li>
				  <li>• Start conservative, increase gradually</li>
				  <li>• Save configuration after finding stable settings</li>
				</ul>
			  </div>
			</div>
		  </div>

		  {/* Tips */}
		  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
			<div className="flex gap-2">
			  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
			  <div>
				<h4 className="font-semibold text-blue-900 mb-1">💡 Pro Tips</h4>
				<ul className="text-xs text-blue-800 space-y-1">
				  <li>• Optimal frequency varies by device and chip quality</li>
				  <li>• Higher frequency = more hashrate but more heat</li>
				  <li>• Monitor hardware errors - too high means reduce freq</li>
				  <li>• Disable devices for maintenance without stopping miner</li>
				  <li>• Use Ctrl+Refresh from home to save your settings</li>
				</ul>
			  </div>
			</div>
		  </div>
		</div>
	  </div>
	</div>
  );
}
