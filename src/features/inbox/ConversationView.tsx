import React, { useEffect, useRef } from 'react';
import {
  Check,
  CheckCheck,
  Clock,
  FileText,
  Image as ImageIcon,
  Info,
  Mic,
  Video,
} from 'lucide-react';
import { WhatsAppChat, WhatsAppMessage } from '@/types/whatsapp';

interface ConversationViewProps {
  chat: WhatsAppChat;
  messages: WhatsAppMessage[];
  onToggleSidebar?: () => void;
  showSidebar?: boolean;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  chat,
  messages,
  onToggleSidebar,
  showSidebar,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const renderStatus = (status?: string) => {
    switch (status) {
      case 'read':
        return <CheckCheck className="h-3 w-3 text-sky-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-zinc-400" />;
      case 'sent':
        return <Check className="h-3 w-3 text-zinc-400" />;
      default:
        return <Clock className="h-3 w-3 text-zinc-500" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden">
      {/* Chat Header */}
      <div className="h-14 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-900/40 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
            {chat.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xs font-bold text-zinc-100 leading-tight">{chat.name}</h2>
            <div className="flex items-center gap-2 text-[10px] text-zinc-400">
              <span>{chat.id}</span>
              <span className="h-1 w-1 rounded-full bg-zinc-600" />
              <span className="text-emerald-400">{chat.isGroup ? 'Group' : 'Direct'}</span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              title="Toggle Contact Details"
              className={`p-1.5 rounded-lg border transition ${
                showSidebar
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 border-zinc-800 bg-zinc-900'
              }`}
            >
              <Info className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-zinc-500">
            No messages recorded in local database for this conversation.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.fromMe;
            return (
              <div
                key={msg.id}
                className={`max-w-[75%] rounded-xl p-3 text-xs leading-relaxed flex flex-col shadow-sm ${
                  isMe
                    ? 'ml-auto bg-emerald-600 text-white rounded-br-none'
                    : 'mr-auto bg-zinc-800 text-zinc-100 rounded-bl-none border border-zinc-700/50'
                }`}
              >
                {/* Quoted Message Preview if present */}
                {msg.quotedMessageId && (
                  <div className="mb-2 p-2 rounded bg-black/20 border-l-2 border-emerald-400 text-[11px] opacity-80">
                    <span className="font-semibold block text-[10px]">Replying to message</span>
                    <span className="truncate block">{msg.quotedMessageId}</span>
                  </div>
                )}

                {/* Media Attachment Previews */}
                {msg.type === 'image' && (
                  <div className="mb-2 rounded overflow-hidden bg-black/20 flex items-center justify-center p-4">
                    <ImageIcon className="h-8 w-8 text-zinc-400" />
                  </div>
                )}
                {msg.type === 'video' && (
                  <div className="mb-2 rounded overflow-hidden bg-black/20 flex items-center justify-center p-4">
                    <Video className="h-8 w-8 text-zinc-400" />
                  </div>
                )}
                {msg.type === 'audio' && (
                  <div className="mb-2 flex items-center gap-2 bg-black/20 p-2 rounded">
                    <Mic className="h-4 w-4 text-emerald-300" />
                    <span className="text-[11px]">Voice Note</span>
                  </div>
                )}
                {msg.type === 'document' && (
                  <div className="mb-2 flex items-center gap-2 bg-black/20 p-2 rounded">
                    <FileText className="h-4 w-4 text-indigo-300" />
                    <span className="text-[11px] truncate">{msg.body || 'Document Attachment'}</span>
                  </div>
                )}

                {/* Body Text */}
                <p className="whitespace-pre-wrap break-words">{msg.body}</p>

                {/* Timestamp & Status */}
                <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-75">
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {isMe && renderStatus(msg.status)}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
