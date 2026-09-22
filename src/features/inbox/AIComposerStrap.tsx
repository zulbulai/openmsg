import React, { useState } from 'react';
import { Sparkles, Wand2, FileText, ChevronDown, Loader2 } from 'lucide-react';
import { AIAssistant } from '@/core/ai/client';
import { useUIStore } from '@/ui/store';

interface AIComposerStrapProps {
  currentText: string;
  onApplyText: (newText: string) => void;
  recentMessages?: string[];
}

export const AIComposerStrap: React.FC<AIComposerStrapProps> = ({
  currentText,
  onApplyText,
  recentMessages = [],
}) => {
  const { setActiveTab } = useUIStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRewriteMenu, setShowRewriteMenu] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerateReply = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const lastIncoming = recentMessages.slice(-1)[0] || currentText || 'Hello, I have a question.';
      const context = recentMessages.slice(-4).join('\n');
      const reply = await AIAssistant.generateReply(lastIncoming, context);
      onApplyText(reply);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to generate reply');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRewrite = async (tone: 'friendly' | 'formal' | 'concise') => {
    if (!currentText.trim()) return;
    setIsGenerating(true);
    setShowRewriteMenu(false);
    setErrorMessage(null);
    try {
      const rewritten = await AIAssistant.rewriteMessage(currentText, tone);
      onApplyText(rewritten);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to rewrite message');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSummarize = async () => {
    if (recentMessages.length === 0) return;
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const summary = await AIAssistant.summarizeConversation(recentMessages);
      onApplyText(summary);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to summarize conversation');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 pb-1">
      <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] select-none">
        {/* Suggest Reply */}
        <button
          type="button"
          disabled={isGenerating}
          onClick={handleGenerateReply}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-medium transition disabled:opacity-50 shrink-0"
        >
          {isGenerating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          <span>Suggest Reply</span>
        </button>

        {/* Rewrite Tone Dropdown */}
        <div className="relative shrink-0">
          <button
            type="button"
            disabled={isGenerating || !currentText.trim()}
            onClick={() => setShowRewriteMenu(!showRewriteMenu)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-750 font-medium transition disabled:opacity-40"
          >
            <Wand2 className="h-3 w-3 text-purple-400" />
            <span>Tone</span>
            <ChevronDown className="h-3 w-3 text-zinc-500" />
          </button>

          {showRewriteMenu && (
            <div className="absolute bottom-full mb-1 left-0 z-20 bg-zinc-900 border border-zinc-800 rounded-xl p-1 shadow-xl flex flex-col gap-0.5 min-w-[120px]">
              <button
                type="button"
                onClick={() => handleRewrite('friendly')}
                className="px-2.5 py-1.5 text-left text-[11px] rounded-lg text-zinc-200 hover:bg-zinc-800 transition"
              >
                Friendly 😊
              </button>
              <button
                type="button"
                onClick={() => handleRewrite('formal')}
                className="px-2.5 py-1.5 text-left text-[11px] rounded-lg text-zinc-200 hover:bg-zinc-800 transition"
              >
                Professional 👔
              </button>
              <button
                type="button"
                onClick={() => handleRewrite('concise')}
                className="px-2.5 py-1.5 text-left text-[11px] rounded-lg text-zinc-200 hover:bg-zinc-800 transition"
              >
                Concise ⚡
              </button>
            </div>
          )}
        </div>

        {/* Summarize Conversation */}
        {recentMessages.length > 0 && (
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleSummarize}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-750 font-medium transition disabled:opacity-50 shrink-0"
          >
            <FileText className="h-3 w-3 text-blue-400" />
            <span>Summarize</span>
          </button>
        )}
      </div>

      {/* Error / Not configured message */}
      {errorMessage && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-400">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="underline font-semibold ml-2 hover:text-red-300"
          >
            Configure Key
          </button>
        </div>
      )}
    </div>
  );
};
