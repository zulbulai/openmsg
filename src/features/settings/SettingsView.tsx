import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Sparkles,
  Check,
  Save,
  Sun,
  Moon,
  Laptop,
  Palette,
} from 'lucide-react';
import { BackupRestore } from './BackupRestore';
import { DiagnosticsView } from './DiagnosticsView';
import { AIAssistant } from '@/core/ai/client';
import { messageQueue } from '@/core/rate-limiter/queue';
import { CustomFieldManager } from '@/features/crm/CustomFieldManager';
import { FollowUpSettingsTab } from './FollowUpSettingsTab';

export const SettingsView: React.FC = () => {
  const [subTab, setSubTab] = useState<'general' | 'fields' | 'followups'>('general');
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');

  // Rate limiting
  const [minDelay, setMinDelay] = useState(3);
  const [maxDelay, setMaxDelay] = useState(8);
  const [maxPerHour, setMaxPerHour] = useState(250);

  // AI
  const [aiProvider, setAiProvider] = useState<'openai' | 'gemini' | 'anthropic' | 'custom'>('openai');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiModel, setAiModel] = useState('gpt-4o-mini');
  const [aiBaseUrl, setAiBaseUrl] = useState('');
  const [isAiSaved, setIsAiSaved] = useState(false);

  useEffect(() => {
    const savedTheme = (localStorage.getItem('openmsg_theme') as any) || 'dark';
    setTheme(savedTheme);
  }, []);

  const handleThemeChange = (newTheme: 'dark' | 'light' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('openmsg_theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  useEffect(() => {
    // Load current queue config
    const qConfig = messageQueue.getConfig();
    setMinDelay(qConfig.minDelayMs / 1000);
    setMaxDelay(qConfig.maxDelayMs / 1000);
    setMaxPerHour(qConfig.maxPerHour);

    // Load AI config
    AIAssistant.getConfig().then((cfg) => {
      if (cfg) {
        setAiProvider(cfg.provider);
        setAiApiKey(cfg.apiKey);
        setAiModel(cfg.model);
        setAiBaseUrl(cfg.baseUrl || '');
      }
    });
  }, []);

  const handleSaveRateLimits = (e: React.FormEvent) => {
    e.preventDefault();
    messageQueue.updateConfig({
      minDelayMs: minDelay * 1000,
      maxDelayMs: maxDelay * 1000,
      maxPerHour,
    });
    alert('Rate limiting settings updated!');
  };

  const handleSaveAI = async (e: React.FormEvent) => {
    e.preventDefault();
    await AIAssistant.saveConfig({
      provider: aiProvider,
      apiKey: aiApiKey.trim(),
      model: aiModel.trim(),
      baseUrl: aiBaseUrl.trim() || undefined,
    });
    setIsAiSaved(true);
    setTimeout(() => setIsAiSaved(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 p-6 overflow-y-auto text-xs">
      <div className="pb-4 border-b border-zinc-800 mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-400" />
            Settings &amp; Configuration
          </h2>
          <p className="text-zinc-400 text-xs mt-0.5">
            Local-first preferences, theme, rate controls, AI credentials, and database backups
          </p>
        </div>

        {/* Subtabs */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 border border-zinc-800 rounded-xl">
          <button
            onClick={() => setSubTab('general')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              subTab === 'general'
                ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setSubTab('fields')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              subTab === 'fields'
                ? 'bg-zinc-800 text-blue-400 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Custom Fields
          </button>
          <button
            onClick={() => setSubTab('followups')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              subTab === 'followups'
                ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Follow-ups
          </button>
        </div>
      </div>

      {subTab === 'fields' ? (
        <CustomFieldManager />
      ) : subTab === 'followups' ? (
        <FollowUpSettingsTab />
      ) : (
        <div className="flex flex-col gap-6 max-w-2xl">
          {/* Appearance & Dark Mode Settings */}
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-100">
              <Palette className="h-4 w-4 text-emerald-400" />
              <span>Theme &amp; Appearance</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Customize the visual interface contrast and theme mode.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  theme === 'dark'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Dark Mode</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  theme === 'light'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                <span>Light Mode</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  theme === 'system'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                <Laptop className="h-3.5 w-3.5" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Anti-Ban & Rate Limiter Settings */}
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-100">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Anti-Ban Throttling & Dispatch Queue
          </div>
          <p className="text-[11px] text-zinc-400">
            Enforces randomized delays between outgoing messages and hourly caps to emulate human pacing.
          </p>

          <form onSubmit={handleSaveRateLimits} className="grid grid-cols-3 gap-3 pt-2">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Min Delay (sec)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={minDelay}
                onChange={(e) => setMinDelay(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-1.5 text-zinc-100"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Max Delay (sec)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={maxDelay}
                onChange={(e) => setMaxDelay(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-1.5 text-zinc-100"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Max Sends / Hour</label>
              <input
                type="number"
                min={10}
                max={1000}
                value={maxPerHour}
                onChange={(e) => setMaxPerHour(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-1.5 text-zinc-100"
              />
            </div>

            <div className="col-span-3 flex justify-end mt-1">
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-1 transition"
              >
                <Save className="h-3.5 w-3.5" />
                Save Throttling Limits
              </button>
            </div>
          </form>
        </div>

        {/* AI Assistant Provider Settings */}
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-100">
            <Sparkles className="h-4 w-4 text-purple-400" />
            AI Assistant Configuration (Optional)
          </div>
          <p className="text-[11px] text-zinc-400">
            Bring your own API key for automated smart replies, message rewriting, and summaries.
            Keys are stored strictly in local browser storage.
          </p>

          <form onSubmit={handleSaveAI} className="flex flex-col gap-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">AI Provider</label>
                <select
                  value={aiProvider}
                  onChange={(e) => {
                    const p = e.target.value as any;
                    setAiProvider(p);
                    if (p === 'gemini') setAiModel('gemini-1.5-flash');
                    else if (p === 'anthropic') setAiModel('claude-3-haiku-20240307');
                    else setAiModel('gpt-4o-mini');
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-1.5 text-zinc-200"
                >
                  <option value="openai">OpenAI</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="custom">Custom (OpenAI Compatible / Ollama)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Model Name</label>
                <input
                  type="text"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-1.5 text-zinc-100"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">API Key</label>
              <input
                type="password"
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-1.5 text-zinc-100"
              />
            </div>

            {aiProvider === 'custom' && (
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Custom Base URL</label>
                <input
                  type="url"
                  value={aiBaseUrl}
                  onChange={(e) => setAiBaseUrl(e.target.value)}
                  placeholder="http://localhost:11434/v1/chat/completions"
                  className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-1.5 text-zinc-100"
                />
              </div>
            )}

            <div className="flex justify-end mt-1">
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg flex items-center gap-1 transition"
              >
                {isAiSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                {isAiSaved ? 'Saved' : 'Save AI Credentials'}
              </button>
            </div>
          </form>
        </div>

        {/* Local Backup & Restore */}
        <BackupRestore />

        {/* Runtime Diagnostics */}
        <DiagnosticsView />
      </div>
      )}
    </div>
  );
};
