import { useState, useEffect } from 'react';
import { Sliders, Zap, Power, PowerOff, Save, RefreshCw, Activity } from 'lucide-react';
import { cgminerAPI } from '../services/cgminer';
import { DeviceInfo } from '../types/miner';

export function ConfigurationPage() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [frequencyInputs, setFrequencyInputs] = useState<{ [key: number]: string }>({});

  const fetchData = async () => {
    setLoading(true);
    const [devicesData, configData] = await Promise.all([
      cgminerAPI.getDevices(),
      cgminerAPI.getConfig(),
    ]);
    setDevices(devicesData);
    setConfig(configData);

    const initialFreqs: { [key: number]: string } = {};
    devicesData.forEach(dev => {
      initialFreqs[dev.id] = dev.frequency?.toString() || '100';
    });
    setFrequencyInputs(initialFreqs);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleEnableDevice = async (deviceId: number) => {
    setActionLoading(`enable-${deviceId}`);
    const success = await cgminerAPI.enableDevice(deviceId);

    if (success) {
      setTimeout(fetchData, 1000);
    } else {
      alert('Failed to enable device');
    }

    setActionLoading(null);
  };

  const handleDisableDevice = async (deviceId: number) => {
    if (!confirm('Are you sure you want to disable this device?')) {
      setActionLoading(null);
      return;
    }

    setActionLoading(`disable-${deviceId}`);
    const success = await cgminerAPI.disableDevice(deviceId);

    if (success) {
      setTimeout(fetchData, 1000);
    } else {
      alert('Failed to disable device');
    }

    setActionLoading(null);
  };

  const handleSetFrequency = async (deviceId: number) => {
    const frequency = parseInt(frequencyInputs[deviceId]);

    if (isNaN(frequency) || frequency < 50 || frequency > 500) {
      alert('Please enter a valid frequency between 50 and 500 MHz');
      return;
    }

    setActionLoading(`freq-${deviceId}`);
    const success = await cgminerAPI.setDeviceFrequency(deviceId, frequency);

    if (success) {
      setTimeout(fetchData, 1000);
    } else {
      alert('Failed to set frequency. Make sure your device supports this command.');
    }

    setActionLoading(null);
  };

  const handleConfigChange = async (name: string, value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      alert('Please enter a valid number');
      return;
    }

    setActionLoading(`config-${name}`);
    const success = await cgminerAPI.setConfig(name, numValue);

    if (success) {
      setTimeout(fetchData, 1000);
    } else {
      alert(`Failed to set ${name}`);
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
          <h2 className="text-xl font-bold text-gray-900">Device Configuration</h2>
          <p className="text-sm text-gray-600 mt-1">Configure device frequency, enable/disable devices, and adjust settings</p>
        </div>
        <button
          onClick={fetchData}
          disabled={actionLoading !== null}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Devices</h3>

          {devices.map((device) => {
            const isAlive = device.status.toLowerCase() === 'alive';

            return (
              <div key={device.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isAlive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{device.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${isAlive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-sm text-gray-600">{device.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAlive ? (
                      <button
                        onClick={() => handleDisableDevice(device.id)}
                        disabled={actionLoading !== null}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded disabled:opacity-50"
                        title="Disable device"
                      >
                        <PowerOff className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnableDevice(device.id)}
                        disabled={actionLoading !== null}
                        className="p-2 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                        title="Enable device"
                      >
                        <Power className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Hashrate</div>
                    <div className="text-lg font-bold text-gray-900">
                      {(device.hashrate / 1000).toFixed(2)} GH/s
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Temperature</div>
                    <div className="text-lg font-bold text-orange-600">
                      {device.temperature.toFixed(1)}°C
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Current Freq</div>
                    <div className="text-lg font-bold text-blue-600">
                      {device.frequency} MHz
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-700">Set Frequency</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        min="50"
                        max="500"
                        value={frequencyInputs[device.id] || ''}
                        onChange={(e) => setFrequencyInputs({
                          ...frequencyInputs,
                          [device.id]: e.target.value
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter frequency (MHz)"
                        disabled={!isAlive}
                      />
                      <p className="text-xs text-gray-500 mt-1">Range: 50-500 MHz</p>
                    </div>
                    <button
                      onClick={() => handleSetFrequency(device.id)}
                      disabled={!isAlive || actionLoading !== null}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === `freq-${device.id}` ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        'Apply'
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 text-sm">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Accepted</div>
                    <div className="font-semibold text-green-600">{device.accepted}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Rejected</div>
                    <div className="font-semibold text-red-600">{device.rejected}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">HW Errors</div>
                    <div className="font-semibold text-orange-600">{device.hardwareErrors}</div>
                  </div>
                </div>
              </div>
            );
          })}

          {devices.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500">No devices detected</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">Global Settings</h3>
            </div>

            <div className="space-y-4">
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
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">Warning</h4>
            <p className="text-sm text-yellow-800">
              Changing frequency and voltage settings can affect device stability and lifespan.
              Monitor temperature closely when overclocking. Hardware damage is possible if settings are too aggressive.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Start with conservative frequency settings</li>
              <li>Monitor temperature and hashrate after changes</li>
              <li>Disable devices for maintenance without stopping miner</li>
              <li>Keep queue size low for better latency</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
