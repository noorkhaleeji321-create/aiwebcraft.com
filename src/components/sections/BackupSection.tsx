import React, { useState } from 'react';
import { Archive, Download, FileJson, FileSpreadsheet, Lock, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';
import { generateDatabaseJsonExport, generateProductsCsvExport, generateCompleteZipBackup, downloadFile } from '../../services/backupService';
import { Language } from '../../locales/translations';

interface BackupSectionProps {
  lang: Language;
}

export const BackupSection: React.FC<BackupSectionProps> = ({ lang }) => {
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [lastChecksum, setLastChecksum] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleExportJson = async () => {
    try {
      const { filename, jsonString, sha256 } = await generateDatabaseJsonExport();
      downloadFile(jsonString, filename, 'application/json');
      setLastChecksum(sha256);
      setNotice(`Full database JSON exported successfully (${filename}). SHA-256 verified.`);
    } catch (err: any) {
      alert('Export error: ' + err.message);
    }
  };

  const handleExportCsv = async () => {
    try {
      const { filename, csvContent } = await generateProductsCsvExport();
      downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
      setNotice(`Products CSV catalog exported successfully (${filename}).`);
    } catch (err: any) {
      alert('CSV export error: ' + err.message);
    }
  };

  const handleExportZip = async () => {
    setIsExportingZip(true);
    setNotice(null);
    try {
      const { blob, filename, checksum } = await generateCompleteZipBackup(encryptionPassword);
      downloadFile(blob, filename, 'application/zip');
      setLastChecksum(checksum);
      setNotice(`Complete backup ZIP archive downloaded (${filename}). Checksum: ${checksum.substring(0, 16)}...`);
    } catch (err: any) {
      alert('ZIP export error: ' + err.message);
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#0B0F19] border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
              DISASTER RECOVERY & ARCHIVES
            </span>
            <span className="text-xs text-emerald-400 font-mono">SHA-256 Integrity Verified</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Central Database & Media Backup Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Export complete snapshots of your relational database, product catalog, media assets, orders, and store settings with client-side encryption.
          </p>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Full Encrypted ZIP Archive */}
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-purple-500/30 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <Archive className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">Complete Archive (ZIP)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bundles the full SQLite database, media catalog, schema manifest, and integrity checksum into a single portable ZIP file.
            </p>

            <div className="mt-3 pt-3 border-t border-slate-800">
              <label className="block text-[11px] text-slate-300 font-medium mb-1">
                Optional AES-256-GCM Password:
              </label>
              <input
                type="password"
                value={encryptionPassword}
                onChange={(e) => setEncryptionPassword(e.target.value)}
                placeholder="Leave blank for unencrypted"
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Encrypts database.json inside the ZIP using Web Crypto
              </span>
            </div>
          </div>

          <button
            onClick={handleExportZip}
            disabled={isExportingZip}
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 shadow-md shadow-purple-900/30 cursor-pointer disabled:opacity-50"
          >
            {isExportingZip ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Building Archive...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download Complete ZIP</span>
              </>
            )}
          </button>
        </div>

        {/* Database JSON Export */}
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <FileJson className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">Database Snapshot (JSON)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Exports all 11 relational tables (products, orders, customers, settings, activity logs) formatted as structured JSON for easy parsing.
            </p>
          </div>

          <button
            onClick={handleExportJson}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export Database JSON</span>
          </button>
        </div>

        {/* Product Catalog CSV */}
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <FileSpreadsheet className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">Product Catalog (CSV)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standard UTF-8 CSV containing SKU, product titles, Arabic names, prices in MAD, stock quantities, and categories for Excel or Google Sheets.
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Products CSV</span>
          </button>
        </div>
      </div>

      {/* Last Generated Integrity Verification */}
      {lastChecksum && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-purple-300 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Latest Archive SHA-256 Checksum:</span>
          </div>
          <span className="font-mono text-slate-300 break-all select-all bg-slate-900 px-3 py-1.5 rounded border border-slate-800 text-[11px]">
            {lastChecksum}
          </span>
        </div>
      )}
    </div>
  );
};
