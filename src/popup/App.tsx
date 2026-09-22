import React from 'react';
import { ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';

export const PopupApp: React.FC = () => {
  const openSidepanel = () => {
    if (typeof chrome !== 'undefined' && chrome.sidePanel && chrome.sidePanel.open) {
      chrome.windows?.getCurrent((win) => {
        if (win?.id) {
          chrome.sidePanel.open({ windowId: win.id });
          window.close();
        }
      });
    }
  };

  const openWhatsApp = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: 'https://web.whatsapp.com' });
      window.close();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <div className="h-7 w-7 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
          OM
        </div>
        <div>
          <h1 className="text-xs font-bold leading-none">OpenMsg</h1>
          <span className="text-[10px] text-zinc-400">Open-source WhatsApp CRM</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={openSidepanel}
          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-semibold text-white flex items-center justify-center gap-2 transition"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Open Side Panel Workspace
        </button>

        <button
          onClick={openWhatsApp}
          className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 rounded text-xs font-semibold text-zinc-200 flex items-center justify-center gap-2 transition"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Launch WhatsApp Web
        </button>
      </div>

      <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-emerald-400" />
          Local-First & Private
        </span>
        <span>v0.1.0</span>
      </div>
    </div>
  );
};
