import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  Search,
  Download,
  Filter,
  Eye,
  Calendar,
  User,
  HardDrive,
} from 'lucide-react';
import { db } from '@/storage/db';
import { MessageRecord } from '@/storage/schemas';

type MediaTypeFilter = 'all' | 'image' | 'video' | 'audio' | 'document';

export const MediaManager: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<MessageRecord[]>([]);
  const [filter, setFilter] = useState<MediaTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreview, setSelectedPreview] = useState<MessageRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMedia = async () => {
    setIsLoading(true);
    try {
      // Find all messages that have media or are marked as media types
      const allMessages = await db.messages.toArray();
      const media = allMessages.filter(
        (m) =>
          Boolean(m.mediaUrl) ||
          m.type === 'image' ||
          m.type === 'video' ||
          m.type === 'audio' ||
          m.type === 'document'
      );
      setMediaItems(media);
    } catch (err) {
      console.error('[MediaManager] Failed to load media from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const filteredItems = mediaItems.filter((item) => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      (item.body && item.body.toLowerCase().includes(q)) ||
      (item.chatId && item.chatId.toLowerCase().includes(q)) ||
      (item.sender && item.sender.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-5 w-5 text-emerald-400" />;
      case 'video':
        return <Video className="h-5 w-5 text-sky-400" />;
      case 'audio':
        return <Music className="h-5 w-5 text-amber-400" />;
      case 'document':
      default:
        return <FileText className="h-5 w-5 text-violet-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Header */}
      <div className="h-16 border-b border-zinc-800/80 px-6 flex items-center justify-between bg-zinc-900/40 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">Media &amp; Assets</h1>
            <p className="text-xs text-zinc-400">Manage, preview, and organize WhatsApp attachments &amp; documents</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search media files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <button
            onClick={loadMedia}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 py-3 border-b border-zinc-800/60 bg-zinc-900/20 flex items-center gap-2 shrink-0">
        <Filter className="h-3.5 w-3.5 text-zinc-500 mr-1" />
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="All Media" count={mediaItems.length} />
        <FilterButton active={filter === 'image'} onClick={() => setFilter('image')} label="Images" count={mediaItems.filter((i) => i.type === 'image').length} />
        <FilterButton active={filter === 'video'} onClick={() => setFilter('video')} label="Videos" count={mediaItems.filter((i) => i.type === 'video').length} />
        <FilterButton active={filter === 'audio'} onClick={() => setFilter('audio')} label="Audio" count={mediaItems.filter((i) => i.type === 'audio').length} />
        <FilterButton active={filter === 'document'} onClick={() => setFilter('document')} label="Documents" count={mediaItems.filter((i) => i.type === 'document').length} />
      </div>

      {/* Content Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs text-zinc-500">
            Loading media catalog...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 text-zinc-600 mb-3">
              <HardDrive className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-300">No media found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1">
              {searchQuery || filter !== 'all'
                ? 'No media matches your filter criteria. Try clearing your search.'
                : 'Media sent or received across WhatsApp conversations will automatically appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden hover:border-zinc-700 transition flex flex-col group shadow-sm"
              >
                {/* Media Preview Box */}
                <div className="h-36 bg-zinc-950 flex items-center justify-center relative overflow-hidden border-b border-zinc-800/60">
                  {item.type === 'image' && item.mediaUrl ? (
                    <img
                      src={item.mediaUrl}
                      alt={item.body || 'Media'}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800">
                      {getItemIcon(item.type)}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button
                      onClick={() => setSelectedPreview(item)}
                      title="Preview Media"
                      className="p-2 rounded-lg bg-zinc-900/90 text-white hover:bg-emerald-600 transition"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {item.mediaUrl && (
                      <a
                        href={item.mediaUrl}
                        download={`media_${item.id}`}
                        title="Download"
                        className="p-2 rounded-lg bg-zinc-900/90 text-white hover:bg-emerald-600 transition"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-3 flex flex-col gap-1.5 flex-1 justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {item.type}
                    </span>
                    <p className="text-xs font-medium text-zinc-200 truncate mt-1">
                      {item.body || `${item.type.toUpperCase()} File`}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1 truncate max-w-[110px]">
                      <User className="h-3 w-3" />
                      {item.fromMe ? 'You' : item.sender || 'Contact'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {selectedPreview && (
        <div className="fixed inset-0 z-[11000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                {getItemIcon(selectedPreview.type)}
                <h3 className="text-sm font-bold text-zinc-100">
                  {selectedPreview.body || `${selectedPreview.type.toUpperCase()} Preview`}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPreview(null)}
                className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded bg-zinc-800"
              >
                Close
              </button>
            </div>

            <div className="max-h-[60vh] flex items-center justify-center overflow-auto rounded-lg bg-zinc-950 p-4">
              {selectedPreview.type === 'image' && selectedPreview.mediaUrl ? (
                <img
                  src={selectedPreview.mediaUrl}
                  alt="Preview"
                  className="max-h-[50vh] object-contain rounded"
                />
              ) : selectedPreview.type === 'video' && selectedPreview.mediaUrl ? (
                <video src={selectedPreview.mediaUrl} controls className="max-h-[50vh] rounded" />
              ) : (
                <div className="text-center py-8 text-zinc-400 text-xs flex flex-col items-center gap-2">
                  <FileText className="h-10 w-10 text-zinc-600" />
                  <span>Media Preview: {selectedPreview.body || selectedPreview.id}</span>
                </div>
              )}
            </div>

            <div className="text-xs text-zinc-400 flex items-center justify-between">
              <span>Chat: {selectedPreview.chatId}</span>
              <span>{new Date(selectedPreview.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}

const FilterButton: React.FC<FilterButtonProps> = ({ active, onClick, label, count }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
      active
        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
    }`}
  >
    <span>{label}</span>
    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-zinc-800 rounded-full text-zinc-400">
      {count}
    </span>
  </button>
);
