import React, { useState, useRef } from 'react';
import {
  SendHorizontal,
  Paperclip,
  FileText,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { MessageTemplate } from '@/storage/schemas';
import { AIComposerStrap } from './AIComposerStrap';

interface MessageComposerProps {
  onSendText: (text: string) => Promise<void>;
  onSendMedia?: (file: File, type: 'image' | 'video' | 'audio' | 'document', caption?: string) => Promise<void>;
  templates?: MessageTemplate[];
  recentMessages?: string[];
  isSending?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendText,
  onSendMedia,
  templates = [],
  recentMessages = [],
  isSending = false,
}) => {
  const [text, setText] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | 'audio' | 'document'>('document');
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending) return;

    if (selectedFile && onSendMedia) {
      await onSendMedia(selectedFile, fileType, caption.trim() || text.trim());
      setSelectedFile(null);
      setCaption('');
      setText('');
      return;
    }

    if (!text.trim()) return;

    const message = text.trim();
    setText('');
    await onSendText(message);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (limit 16MB for WhatsApp web safety)
    if (file.size > 16 * 1024 * 1024) {
      alert('File size exceeds 16MB limit.');
      return;
    }

    let type: 'image' | 'video' | 'audio' | 'document' = 'document';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';

    setSelectedFile(file);
    setFileType(type);
  };

  return (
    <div className="border-t border-zinc-800 bg-zinc-900/60 p-3 flex flex-col gap-2 shrink-0">
      {/* File Attachment Preview */}
      {selectedFile && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs">
          <div className="flex items-center gap-2 truncate">
            <ImageIcon className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="truncate text-zinc-200">{selectedFile.name}</span>
            <span className="text-[10px] text-zinc-400 shrink-0">
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Templates Dropdown Menu */}
      {showTemplates && templates.length > 0 && (
        <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 flex flex-col gap-1 max-h-40 overflow-y-auto">
          <span className="text-[10px] font-bold text-zinc-400 px-2 uppercase">
            Quick Templates
          </span>
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => {
                setText((prev) => (prev ? `${prev} ${tpl.content}` : tpl.content));
                setShowTemplates(false);
              }}
              className="text-left px-2 py-1.5 rounded hover:bg-zinc-700 text-xs text-zinc-200 transition truncate"
            >
              <span className="font-semibold text-emerald-400">{tpl.title}: </span>
              {tpl.content}
            </button>
          ))}
        </div>
      )}

      {/* AI Quick Assistant Strap */}
      <AIComposerStrap
        currentText={text}
        onApplyText={(t) => setText(t)}
        recentMessages={recentMessages}
      />

      {/* Main Composer Form */}
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        {/* Templates Button */}
        {templates.length > 0 && (
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            title="Use message template"
            className={`p-2 rounded-lg transition ${
              showTemplates
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <FileText className="h-4 w-4" />
          </button>
        )}

        {/* Text Input */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={selectedFile ? 'Add a caption (optional)...' : 'Type a message...'}
          className="flex-1 bg-zinc-900 border border-zinc-700/60 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={isSending || (!text.trim() && !selectedFile)}
          className="h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
        >
          <SendHorizontal className="h-3.5 w-3.5" />
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};
