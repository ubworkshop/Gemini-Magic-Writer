import React, { useEffect, useState } from 'react';
import { X, Cpu, Thermometer, Box, AlertCircle, Check, Key, Globe, Eye, EyeOff } from 'lucide-react';
import { AppSettings, AiProvider } from '../types';
import { MODEL_OPTIONS, AI_PROVIDERS } from '../constants';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [showApiKey, setShowApiKey] = useState(false);

  // Reset local state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
      setShowApiKey(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleProviderChange = (provider: AiProvider) => {
    // When switching provider, set default model for that provider
    const defaultModel = MODEL_OPTIONS[provider][0].id;
    const providerConfig = AI_PROVIDERS.find(p => p.id === provider);
    
    setLocalSettings({
      ...localSettings,
      provider,
      model: defaultModel,
      // Auto-fill default base URL if empty or if switching to a new provider defaults
      customBaseUrl: providerConfig?.defaultBaseUrl || ''
    });
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const currentProvider = AI_PROVIDERS.find(p => p.id === localSettings.provider);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-800">Settings</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <Box className="w-4 h-4 text-purple-600" />
              AI Provider
            </label>
            <div className="grid grid-cols-2 gap-3">
              {AI_PROVIDERS.map((p) => {
                const isActive = localSettings.provider === p.id;
                const isEnabled = p.active; 

                return (
                  <button
                    key={p.id}
                    onClick={() => isEnabled && handleProviderChange(p.id as AiProvider)}
                    disabled={!isEnabled}
                    className={`
                      relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all
                      ${isActive 
                        ? 'border-purple-500 bg-purple-50 text-purple-900 ring-1 ring-purple-500' 
                        : isEnabled 
                          ? 'border-gray-200 hover:border-purple-200 hover:bg-slate-50 text-slate-700'
                          : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-70'
                      }
                    `}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-white' : 'bg-slate-100'}`}>
                       {/* Icon placeholder logic */}
                       <div className="w-4 h-4 font-bold text-xs flex items-center justify-center">
                        {p.name.charAt(0)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{p.name}</div>
                      {!isEnabled && <div className="text-[10px] text-gray-400">Coming Soon</div>}
                    </div>
                    {isActive && <Check className="w-4 h-4 text-purple-600" />}
                  </button>
                );
              })}
            </div>
            
            {localSettings.provider !== 'google' && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700 space-y-2">
                <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>
                        You are configuring a custom provider. Your API Key is stored locally in your browser and is never sent to our servers.
                    </span>
                </div>
              </div>
            )}
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-600" />
              Model
            </label>
            <select
              value={localSettings.model}
              onChange={(e) => setLocalSettings({...localSettings, model: e.target.value})}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
            >
              {MODEL_OPTIONS[localSettings.provider]?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Custom API Configuration (Only for non-Google providers) */}
          {localSettings.provider !== 'google' && (
             <div className="space-y-4 pt-2 border-t border-gray-100">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <Key className="w-4 h-4 text-purple-600" />
                        API Key
                    </label>
                    <div className="relative">
                        <input 
                            type={showApiKey ? "text" : "password"}
                            value={localSettings.customApiKey || ''}
                            onChange={(e) => setLocalSettings({...localSettings, customApiKey: e.target.value})}
                            placeholder={`Enter your ${currentProvider?.name} API Key`}
                            className="w-full p-2.5 pr-10 bg-white border border-gray-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none placeholder:text-gray-400"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-purple-600" />
                        Base URL
                    </label>
                    <input 
                        type="text"
                        value={localSettings.customBaseUrl || ''}
                        onChange={(e) => setLocalSettings({...localSettings, customBaseUrl: e.target.value})}
                        placeholder="https://api.openai.com/v1"
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none placeholder:text-gray-400 font-mono"
                    />
                    <p className="mt-1 text-xs text-slate-400">
                        Leave blank to use default: {currentProvider?.defaultBaseUrl}
                    </p>
                </div>
             </div>
          )}

          {/* Temperature Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-purple-600" />
                Creativity
              </label>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {localSettings.temperature}
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1"
              value={localSettings.temperature}
              onChange={(e) => setLocalSettings({...localSettings, temperature: parseFloat(e.target.value)})}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Precise</span>
              <span>Balanced</span>
              <span>Creative</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium shadow-lg hover:bg-slate-800 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
