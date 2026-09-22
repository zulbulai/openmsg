import { create } from 'zustand';
import { WhatsAppUser, WhatsAppChat } from '@/types/whatsapp';

export type ActiveTab =
  | 'dashboard'
  | 'inbox'
  | 'crm'
  | 'chatbot'
  | 'workflows'
  | 'automation'
  | 'broadcasts'
  | 'scheduler'
  | 'templates'
  | 'webhooks'
  | 'ai'
  | 'analytics'
  | 'settings';

interface UIState {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  isConnected: boolean;
  currentUser: WhatsAppUser | null;
  setConnection: (connected: boolean, user: WhatsAppUser | null) => void;

  activeChat: WhatsAppChat | null;
  setActiveChat: (chat: WhatsAppChat | null) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;

  isGlobalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  isConnected: false,
  currentUser: null,
  setConnection: (connected, user) => set({ isConnected: connected, currentUser: user }),

  activeChat: null,
  setActiveChat: (chat) => set({ activeChat: chat }),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  isGlobalSearchOpen: false,
  setGlobalSearchOpen: (open) => set({ isGlobalSearchOpen: open }),
}));
