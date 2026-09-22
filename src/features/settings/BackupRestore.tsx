import React, { useState, useRef } from 'react';
import { Download, Upload, CheckCircle2, Database } from 'lucide-react';
import { BackupService, RestorePreview } from '@/core/backup/backup-service';

export const BackupRestore: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [pendingBackupText, setPendingBackupText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const json = await BackupService.createBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `openmsg_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const p = BackupService.previewBackup(text);
    if (!p.valid) {
      alert(`Invalid backup file: ${p.error}`);
      setPreview(null);
      setPendingBackupText(null);
      return;
    }

    setPreview(p);
    setPendingBackupText(text);
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!pendingBackupText) return;
    setIsRestoring(true);
    try {
      await BackupService.restoreBackup(pendingBackupText);
      alert(`Restore complete! Successfully restored tables.`);
      setPreview(null);
      setPendingBackupText(null);
      window.location.reload();
    } catch (err: any) {
      alert(`Restore failed: ${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col gap-4 text-xs">
      <div className="flex items-center gap-2 font-bold text-zinc-100">
        <Database className="h-4 w-4 text-emerald-400" />
        Local Database Backup & Restore
      </div>
      <p className="text-zinc-400 leading-relaxed text-[11px]">
        All OpenMsg data is stored in your browser&apos;s local IndexedDB sandbox. Export regular backups to
        prevent data loss or migrate to a new device.
      </p>

      <div className="flex gap-3">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-semibold flex items-center gap-1.5 transition"
        >
          <Download className="h-3.5 w-3.5 text-emerald-400" />
          {isExporting ? 'Exporting...' : 'Export Full Backup'}
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelected}
          accept=".json"
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-semibold flex items-center gap-1.5 transition"
        >
          <Upload className="h-3.5 w-3.5 text-sky-400" />
          Restore Backup
        </button>
      </div>

      {/* Restore Preview Dialog */}
      {preview && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col gap-3 mt-2">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            Backup Verified (Schema v{preview.schemaVersion})
          </div>

          <div className="grid grid-cols-3 gap-2 bg-zinc-950/60 p-3 rounded-lg border border-zinc-800 text-[11px]">
            {Object.entries(preview.counts).map(([table, count]) => (
              <div key={table} className="flex justify-between">
                <span className="text-zinc-400 capitalize">{table}:</span>
                <span className="text-zinc-200 font-bold">{count}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setPreview(null);
                setPendingBackupText(null);
              }}
              className="px-3 py-1.5 border border-zinc-700 rounded-lg text-zinc-400 hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRestore}
              disabled={isRestoring}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg"
            >
              {isRestoring ? 'Restoring...' : 'Confirm & Overwrite Data'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
