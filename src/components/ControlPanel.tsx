import { RefreshCw, Power, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { cgminerAPI } from '../services/cgminer';

interface ControlPanelProps {
  onRefresh: () => void;
}

export function ControlPanel({ onRefresh }: ControlPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleRestart = async () => {
    if (!confirm('Are you sure you want to restart CGMiner? This will temporarily stop mining.')) {
      return;
    }

    setLoading('restart');
    try {
      const success = await cgminerAPI.restart();
      if (success) {
        showMessage('success', 'CGMiner restart command sent successfully');
        // Wait a bit before refreshing to allow restart
        setTimeout(() => {
          onRefresh();
          setLoading(null);
        }, 3000);
      } else {
        showMessage('error', 'Failed to restart CGMiner');
        setLoading(null);
      }
    } catch (error) {
      showMessage('error', 'Error restarting CGMiner: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setLoading(null);
    }
  };

  const handleQuit = async () => {
    if (!confirm('⚠️ WARNING: Are you sure you want to QUIT CGMiner?\n\nThis will:\n- Stop ALL mining operations\n- Shut down CGMiner completely\n- Require manual restart\n\nThis action cannot be undone from the web interface.')) {
      return;
    }

    setLoading('quit');
    try {
      const success = await cgminerAPI.quit();
      if (success) {
        showMessage('success', 'CGMiner quit command sent - CGMiner is shutting down');
        setLoading(null);
      } else {
        showMessage('error', 'Failed to quit CGMiner');
        setLoading(null);
      }
    } catch (error) {
      showMessage('error', 'Error quitting CGMiner: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setLoading(null);
    }
  };

  const handleSave = async () => {
    setLoading('save');
    try {
      const response = await fetch(`http://${window.location.hostname}:3001/api/control/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        showMessage('success', 'Configuration saved successfully to cgminer.conf');
      } else {
        showMessage('error', 'Failed to save configuration');
      }
      setLoading(null);
    } catch (error) {
      showMessage('error', 'Error saving config: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Status Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="space-y-3">
        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          <RefreshCw className={`w-5 h-5 ${loading === 'refresh' ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>

        {/* Save Config Button */}
        <button
          onClick={handleSave}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          <Save className={`w-5 h-5 ${loading === 'save' ? 'animate-pulse' : ''}`} />
          <span>{loading === 'save' ? 'Saving...' : 'Save Config'}</span>
        </button>

        {/* Restart Button */}
        <button
          onClick={handleRestart}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          <RefreshCw className={`w-5 h-5 ${loading === 'restart' ? 'animate-spin' : ''}`} />
          <span>{loading === 'restart' ? 'Restarting...' : 'Restart CGMiner'}</span>
        </button>

        {/* Quit Button */}
        <button
          onClick={handleQuit}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          <Power className={`w-5 h-5 ${loading === 'quit' ? 'animate-pulse' : ''}`} />
          <span>{loading === 'quit' ? 'Quitting...' : 'Quit CGMiner'}</span>
        </button>
      </div>

      {/* Warning Note */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-yellow-800">
            <p className="font-semibold mb-1">⚠️ Important:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>Restart:</strong> Temporarily stops mining (~5-10 sec)</li>
              <li><strong>Quit:</strong> Completely shuts down CGMiner (requires SSH/manual restart)</li>
              <li><strong>Save:</strong> Writes current config to cgminer.conf file</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}