import React, { useState } from 'react';
import { RotateCcw, Upload, ShieldCheck, AlertTriangle, CheckCircle2, RefreshCw, FileText } from 'lucide-react';
import { verifyAndPreviewBackup, executeFullRestore, RestorePreview } from '../../services/backupService';
import { Language } from '../../locales/translations';

interface RestoreSectionProps {
  lang: Language;
  onRefresh: () => void;
}

export const RestoreSection: React.FC<RestoreSectionProps> = ({ lang, onRefresh }) => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setPreview(null);
    setStatusMessage(null);
    setHasConfirmed(false);

    const reader = new FileReader();
    reader.onload = async () => {
      const text = reader.result as string;
      setFileContent(text);
      await runVerification(text, password);
    };
    reader.readAsText(file);
  };

  const runVerification = async (content: string, pass: string) => {
    setIsVerifying(true);
    setStatusMessage(null);
    try {
      const res = await verifyAndPreviewBackup(content, pass);
      setPreview(res);
      if (!res.valid) {
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleApplyRestore = async () => {
    if (!preview || !preview.dataToRestore) return;
    if (!hasConfirmed) {
      alert('Please check the confirmation box acknowledging that current tables will be replaced.');
      return;
    }

    setIsRestoring(true);
    setStatusMessage(null);
    try {
      const result = await executeFullRestore(preview.dataToRestore);
      if (result.success) {
        setStatusMessage({ type: 'success', text: result.message + ' An automated rollback snapshot was saved.' });
        onRefresh();
      } else {
        setStatusMessage({ type: 'error', text: result.message });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#0B0F19] border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
              DISASTER RECOVERY ENGINE
            </span>
            <span className="text-xs text-emerald-400 font-mono">Safety Rollback Enabled</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Database Restore & Integrity Verification Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Safely restore your e-commerce database from a JSON or encrypted backup archive. An automated rollback snapshot is captured before any write.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* File Upload Box */}
      <div className="p-6 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Upload className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Select Backup Snapshot File (.json or .enc.json)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Upload Database File:
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
            />
            {fileName && (
              <div className="mt-2 text-[11px] text-purple-300 font-mono">
                Loaded file: {fileName}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Decryption Passphrase (if encrypted):
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter passphrase if backup is encrypted"
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
              />
              <button
                type="button"
                onClick={() => fileContent && runVerification(fileContent, password)}
                disabled={!fileContent || isVerifying}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-40"
              >
                {isVerifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Restoration Preview Details */}
      {preview && preview.valid && preview.manifest && (
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-purple-500/40 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Integrity Pre-Flight Verification Passed
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">SHA-256 Validated</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Schema Version:</span>
              <span className="font-mono text-white font-bold">{preview.manifest.version}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Snapshot Timestamp:</span>
              <span className="font-mono text-white text-[11px]">
                {new Date(preview.manifest.created_at).toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Encrypted Payload:</span>
              <span className="font-mono text-purple-300">
                {preview.manifest.encrypted ? 'YES (AES-GCM)' : 'NO'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Tables to Restore:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {Object.keys(preview.manifest.table_counts).length} Relational Tables
              </span>
            </div>
          </div>

          {/* Table Counts Diff */}
          <div>
            <div className="text-xs font-medium text-slate-300 mb-2">
              Records Preview by Table:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 font-mono text-[11px]">
              {Object.entries(preview.manifest.table_counts).map(([tbl, count]) => (
                <div key={tbl} className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">{tbl}:</span>
                  <span className="text-purple-300 font-bold">{count} rows</span>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={hasConfirmed}
                onChange={(e) => setHasConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-purple-600 bg-slate-900 focus:ring-0"
              />
              <span>
                I confirm that I want to replace current live database tables with this backup. An automated safety rollback point will be created before applying.
              </span>
            </label>

            <button
              onClick={handleApplyRestore}
              disabled={!hasConfirmed || isRestoring}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-lg flex items-center gap-2 shadow-lg shadow-purple-900/30 cursor-pointer disabled:opacity-40"
            >
              {isRestoring ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Restoring Database...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Execute Full Restoration</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
