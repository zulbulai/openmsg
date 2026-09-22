import React, { useState } from 'react';
import { Search, Users, User, Check, CheckCheck, Clock } from 'lucide-react';
import { WhatsAppChat } from '@/types/whatsapp';

interface ChatListProps {
  chats: WhatsAppChat[];
  activeChat: WhatsAppChat | null;
  onSelectChat: (chat: WhatsAppChat) => void;
  isLoading?: boolean;
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  activeChat,
  onSelectChat,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  const filteredChats = chats.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.lastMessage?.body || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUnread = filterUnreadOnly ? (c.unreadCount ?? 0) > 0 : true;
    return matchesSearch && matchesUnread;
  });

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-80 h-full border-r border-zinc-800 flex flex-col bg-zinc-900/30">
      {/* Search and Filters */}
      <div className="p-3 border-b border-zinc-800 flex flex-col gap-2">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats or messages..."
            className="w-full bg-zinc-900 border border-zinc-700/60 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterUnreadOnly(false)}
              className={`px-2 py-0.5 rounded transition ${
                !filterUnreadOnly
                  ? 'bg-zinc-800 text-zinc-200 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All ({chats.length})
            </button>
            <button
              onClick={() => setFilterUnreadOnly(true)}
              className={`px-2 py-0.5 rounded transition ${
                filterUnreadOnly
                  ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Unread
            </button>
          </div>
          <span className="text-[10px] text-zinc-400">
            {filteredChats.length} results
          </span>
        </div>
      </div>

      {/* Chat List Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/40">
        {isLoading ? (
          <div className="p-6 text-center text-xs text-zinc-500 animate-pulse">
            Loading conversations...
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500">
            {searchQuery ? 'No chats match your search' : 'No chats found'}
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = activeChat?.id === chat.id;
            return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={`w-full text-left p-3 flex items-start gap-3 transition ${
                  isSelected
                    ? 'bg-emerald-500/10 border-l-2 border-emerald-500'
                    : 'hover:bg-zinc-900/60'
                }`}
              >
                {/* Avatar */}
                <div className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0 text-zinc-400 font-bold text-xs">
                  {chat.isGroup ? (
                    <Users className="h-4 w-4 text-indigo-400" />
                  ) : (
                    <User className="h-4 w-4 text-emerald-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold truncate text-zinc-200">
                      {chat.name || chat.id}
                    </span>
                    <span className="text-[10px] text-zinc-400 shrink-0 ml-1">
                      {formatTime(chat.lastMessage?.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-zinc-400 truncate flex items-center gap-1">
                      {chat.lastMessage?.fromMe && (
                        chat.lastMessage.status === 'read' ? (
                          <CheckCheck className="h-3 w-3 text-sky-400 shrink-0" />
                        ) : chat.lastMessage.status === 'delivered' ? (
                          <CheckCheck className="h-3 w-3 text-zinc-400 shrink-0" />
                        ) : chat.lastMessage.status === 'sent' ? (
                          <Check className="h-3 w-3 text-zinc-400 shrink-0" />
                        ) : (
                          <Clock className="h-3 w-3 text-zinc-500 shrink-0" />
                        )
                      )}
                      <span className="truncate">
                        {chat.lastMessage?.body || 'No messages yet'}
                      </span>
                    </p>

                    {(chat.unreadCount ?? 0) > 0 && (
                      <span className="h-4 min-w-4 px-1 rounded-full bg-emerald-500 text-[10px] font-bold text-zinc-950 flex items-center justify-center shrink-0 ml-1">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
