import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  MessageSquare,
  Users,
  Workflow,
  FileText,
  Send,
  ArrowRight,
} from 'lucide-react';
import { db } from '@/storage/db';
import { useUIStore, ActiveTab } from '@/ui/store';

interface SearchResultItem {
  id: string;
  type: 'contact' | 'message' | 'workflow' | 'template' | 'campaign';
  title: string;
  subtitle: string;
  tab: ActiveTab;
  chatId?: string;
}

export const GlobalSearchModal: React.FC = () => {
  const { isGlobalSearchOpen, setGlobalSearchOpen, setActiveTab, setActiveChat } = useUIStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(!isGlobalSearchOpen);
      }
      if (e.key === 'Escape' && isGlobalSearchOpen) {
        setGlobalSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGlobalSearchOpen, setGlobalSearchOpen]);

  // Focus on open
  useEffect(() => {
    if (isGlobalSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
    }
  }, [isGlobalSearchOpen]);

  // Execute search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const q = query.toLowerCase().trim();
      const combined: SearchResultItem[] = [];

      try {
        // 1. Search Contacts
        const contacts = await db.contacts
          .filter(
            (c) =>
              Boolean((c.name && c.name.toLowerCase().includes(q)) ||
              (c.phone && c.phone.includes(q)))
          )
          .limit(5)
          .toArray();

        contacts.forEach((c) => {
          combined.push({
            id: c.id,
            type: 'contact',
            title: c.name || c.phone,
            subtitle: c.phone,
            tab: 'crm',
            chatId: c.id,
          });
        });

        // 2. Search Messages
        const messages = await db.messages
          .filter((m) => Boolean(m.body && m.body.toLowerCase().includes(q)))
          .limit(5)
          .toArray();

        messages.forEach((m) => {
          combined.push({
            id: m.id,
            type: 'message',
            title: m.body.length > 50 ? `${m.body.slice(0, 50)}...` : m.body,
            subtitle: `Chat: ${m.chatId} • ${new Date(m.timestamp).toLocaleDateString()}`,
            tab: 'inbox',
            chatId: m.chatId,
          });
        });

        // 3. Search Workflows
        const workflows = await db.workflows
          .filter((w) => Boolean(w.name && w.name.toLowerCase().includes(q)))
          .limit(5)
          .toArray();

        workflows.forEach((w) => {
          combined.push({
            id: w.id,
            type: 'workflow',
            title: w.name,
            subtitle: `Trigger: ${w.triggerType} • ${w.isActive ? 'Active' : 'Inactive'}`,
            tab: 'workflows',
          });
        });

        // 4. Search Templates
        const templates = await db.templates
          .filter(
            (t) =>
              Boolean((t.title && t.title.toLowerCase().includes(q)) ||
              (t.content && t.content.toLowerCase().includes(q)))
          )
          .limit(5)
          .toArray();

        templates.forEach((t) => {
          combined.push({
            id: t.id,
            type: 'template',
            title: t.title,
            subtitle: t.content.slice(0, 40),
            tab: 'templates',
          });
        });

        // 5. Search Campaigns
        const campaigns = await db.broadcastCampaigns
          .filter((c) => Boolean(c.name && c.name.toLowerCase().includes(q)))
          .limit(5)
          .toArray();

        campaigns.forEach((c) => {
          combined.push({
            id: c.id,
            type: 'campaign',
            title: c.name,
            subtitle: `Status: ${c.status} • Total: ${c.totalRecipients}`,
            tab: 'broadcasts',
          });
        });

        setResults(combined);
      } catch (err) {
        console.error('Search query failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isGlobalSearchOpen) return null;

  const handleSelect = (item: SearchResultItem) => {
    setActiveTab(item.tab);
    if (item.chatId && item.tab === 'inbox') {
      db.conversations.get(item.chatId).then((conv) => {
        if (conv) {
          setActiveChat({
            id: conv.id,
            name: conv.id,
            unreadCount: conv.unreadCount || 0,
            isGroup: false,
            pinned: conv.pinned || false,
            archived: conv.archived || false,
          });
        }
      });
    }
    setGlobalSearchOpen(false);
  };

  const getTypeIcon = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'contact':
        return <Users className="h-4 w-4 text-blue-400" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-emerald-400" />;
      case 'workflow':
        return <Workflow className="h-4 w-4 text-amber-400" />;
      case 'template':
        return <FileText className="h-4 w-4 text-purple-400" />;
      case 'campaign':
        return <Send className="h-4 w-4 text-pink-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-zinc-800 gap-3">
          <Search className="h-5 w-5 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts, messages, flows, templates..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-zinc-500 hover:text-zinc-300 transition"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setGlobalSearchOpen(false)}
            className="text-xs text-zinc-500 hover:text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-800/50"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-80 overflow-y-auto p-2">
          {isSearching ? (
            <div className="py-8 text-center text-xs text-zinc-500">Searching workspace...</div>
          ) : query && results.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800/70 text-left transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/50 shrink-0">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-zinc-200 truncate group-hover:text-emerald-400 transition">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate">{item.subtitle}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-zinc-600 group-hover:text-zinc-400 text-xs">
                    <span className="capitalize text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
                      {item.type}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-6 px-4 text-center text-xs text-zinc-500">
              Type to quickly locate contacts, conversation messages, workflow automations, and campaigns.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
