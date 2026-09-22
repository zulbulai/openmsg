import React from 'react';
import { ShieldCheck, HardDrive, Cpu, ExternalLink } from 'lucide-react';

export const OptionsApp: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 flex flex-col gap-8">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <span className="h-7 w-7 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
              OM
            </span>
            OpenMsg Configuration
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Open-source WhatsApp Automation & CRM (v0.1.0)</p>
        </div>
        <a
          href="https://github.com/openmsg-dev/openmsg"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition"
        >
          GitHub Repository
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Anti-Ban */}
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Anti-Ban Dispatcher Settings
          </h2>
          <p className="text-xs text-zinc-400">
            Enforces randomized delays between outgoing automated messages to emulate human pacing and protect accounts.
          </p>
          <div className="space-y-3 mt-2 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1">Randomized Delay Range (Seconds)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  defaultValue={3}
                  className="w-24 bg-zinc-900 border border-zinc-700/60 rounded px-2.5 py-1.5 text-zinc-200"
                />
                <span className="text-zinc-500">to</span>
                <input
                  type="number"
                  defaultValue={8}
                  className="w-24 bg-zinc-900 border border-zinc-700/60 rounded px-2.5 py-1.5 text-zinc-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Max Hourly Dispatch Cap</label>
              <input
                type="number"
                defaultValue={250}
                className="w-32 bg-zinc-900 border border-zinc-700/60 rounded px-2.5 py-1.5 text-zinc-200"
              />
            </div>
          </div>
        </div>

        {/* Storage */}
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-emerald-400" />
            Storage Engine
          </h2>
          <p className="text-xs text-zinc-400">
            Contacts, notes, and workflows are persisted locally inside IndexedDB via Dexie. No remote database connection required.
          </p>
          <div className="mt-auto pt-4 flex gap-2">
            <button
              onClick={() => alert('Backup exported successfully!')}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-semibold text-white transition"
            >
              Export JSON Backup
            </button>
          </div>
        </div>

        {/* AI Providers */}
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col gap-3 md:col-span-2">
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-emerald-400" />
            Bring-Your-Own-Key AI Configuration (Optional)
          </h2>
          <p className="text-xs text-zinc-400">
            Configure personal API keys for automated smart replies. Keys remain strictly within your local extension storage.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">OpenAI API Key</label>
              <input
                type="password"
                placeholder="sk-..."
                className="w-full bg-zinc-900 border border-zinc-700/60 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Google Gemini API Key</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                className="w-full bg-zinc-900 border border-zinc-700/60 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Anthropic Claude API Key</label>
              <input
                type="password"
                placeholder="sk-ant-..."
                className="w-full bg-zinc-900 border border-zinc-700/60 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
