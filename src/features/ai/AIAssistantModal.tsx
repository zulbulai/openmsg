import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Wand2,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { AIAssistant, AIConfig } from '@/core/ai/client';
import { useUIStore } from '@/ui/store';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertText?: (text: string) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onInsertText,
}) => {
  const { setActiveTab } = useUIStore();
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [mode, setMode] = useState<'reply' | 'rewrite' | 'summarize' | 'translate'>('reply');
  const [inputText, setInputText] = useState('');
  const [tone, setTone] = useState<'friendly' | 'formal' | 'concise'>('friendly');
  const [targetLang, setTargetLang] = useState('Hindi');
  const [resultText, setResultText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      AIAssistant.getConfig().then(setConfig);
      setResultText('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    setError(null);
    setCopied(false);

    try {
      if (mode === 'reply') {
        const res = await AIAssistant.generateReply(inputText);
        setResultText(res);
      } else if (mode === 'rewrite') {
        const res = await AIAssistant.rewriteMessage(inputText, tone);
        setResultText(res);
      } else if (mode === 'summarize') {
        const res = await AIAssistant.summarizeConversation([inputText]);
        setResultText(res);
      } else if (mode === 'translate') {
        const prompt = `Translate the following text into ${targetLang}. Return only the translated text without commentary:\n\n"${inputText}"`;
        const cfg = await AIAssistant.getConfig();
        if (!cfg) throw new Error('AI Assistant is not configured.');
        const res = await (AIAssistant as any).completePrompt(cfg, prompt, 'You are an accurate translator.');
        setResultText(res);
      }
    } catch (err: any) {
      setError(err?.message || 'AI request failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!resultText) return;
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (!resultText || !onInsertText) return;
    onInsertText(resultText);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                AI Messaging Assistant
                {config && (
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">
                    {config.provider} • {config.model}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-zinc-400">
                Optional LLM intelligence for customer support and copywriting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Unconfigured Alert */}
        {!config && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between gap-2 text-amber-300">
            <span>No AI provider configured yet. Add your OpenAI, Gemini, or Claude key.</span>
            <button
              onClick={() => {
                onClose();
                setActiveTab('settings');
              }}
              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold transition shrink-0"
            >
              Open Settings
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Mode Selector */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px]">
            <button
              type="button"
              onClick={() => setMode('reply')}
              className={`py-1.5 rounded-lg font-medium transition ${
                mode === 'reply' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Generate Reply
            </button>
            <button
              type="button"
              onClick={() => setMode('rewrite')}
              className={`py-1.5 rounded-lg font-medium transition ${
                mode === 'rewrite' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Rewrite Tone
            </button>
            <button
              type="button"
              onClick={() => setMode('summarize')}
              className={`py-1.5 rounded-lg font-medium transition ${
                mode === 'summarize' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Summarize
            </button>
            <button
              type="button"
              onClick={() => setMode('translate')}
              className={`py-1.5 rounded-lg font-medium transition ${
                mode === 'translate' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Translate
            </button>
          </div>

          {/* Context Options */}
          {mode === 'rewrite' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400 font-medium">Desired Tone:</span>
              <div className="flex gap-1.5">
                {(['friendly', 'formal', 'concise'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`px-2.5 py-1 rounded-lg capitalize border text-xs transition ${
                      tone === t
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'translate' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400 font-medium">Target Language:</span>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Hindi">Hindi (हिन्दी)</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="French">French (Français)</option>
                <option value="German">German (Deutsch)</option>
                <option value="Arabic">Arabic (العربية)</option>
                <option value="English">English</option>
              </select>
            </div>
          )}

          {/* Input text */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">
              {mode === 'reply'
                ? 'Customer Message'
                : mode === 'rewrite'
                  ? 'Draft to Polish'
                  : mode === 'summarize'
                    ? 'Conversation Text'
                    : 'Source Text'}
            </label>
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                mode === 'reply'
                  ? 'Paste customer query here...'
                  : 'Enter text to transform...'
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 resize-none font-sans"
            />
          </div>

          {/* Generate Button */}
          <button
            type="button"
            disabled={isGenerating || !inputText.trim() || !config}
            onClick={handleGenerate}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-emerald-950/40"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>{isGenerating ? 'AI Thinking...' : 'Generate Response'}</span>
          </button>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Output text */}
          {resultText && (
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Wand2 className="h-3.5 w-3.5" />
                  <span>AI Result</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 p-1"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  {onInsertText && (
                    <button
                      type="button"
                      onClick={handleInsert}
                      className="px-2.5 py-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-lg text-xs font-semibold transition"
                    >
                      Insert into Chat
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-100 font-sans leading-relaxed whitespace-pre-wrap">
                {resultText}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
