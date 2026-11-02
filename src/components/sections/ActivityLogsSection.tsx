import React, { useState } from 'react';
import { ListRestart, Search, Filter, Download, ShieldCheck, Clock } from 'lucide-react';
import { ActivityLog } from '../../types';
import { downloadFile } from '../../services/backupService';
import { Language } from '../../locales/translations';

interface ActivityLogsSectionProps {
  logs: ActivityLog[];
  lang: Language;
}

export const ActivityLogsSection: React.FC<ActivityLogsSectionProps> = ({ logs, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filtered = logs.filter((l) => {
    const matchesType = selectedType === 'all' || l.action_type === selectedType;
    const matchesSearch =
      l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.entity_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleExportLogs = () => {
    const json = JSON.stringify(logs, null, 2);
    downloadFile(json, `aiwebcrafter-audit-logs-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#0B0F19] border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
              IMMUTABLE AUDIT LOG
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-emerald-400 font-mono tabular-nums">{logs.length} Recorded Events</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            System & Security Audit Activity Logs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic ledger tracking authentication, catalog updates, order submissions, and database operations.
          </p>
        </div>

        <button
          onClick={handleExportLogs}
          className="px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-purple-400" />
          <span>Export Logs (JSON)</span>
        </button>
      </div>

      {/* Filter */}
      <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by details, actor, or entity..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer w-full sm:w-auto"
          >
            <option value="all">All Action Types ({logs.length})</option>
            <option value="AUTH">AUTH</option>
            <option value="ORDER_RECEIVED">ORDER_RECEIVED</option>
            <option value="ORDER_STATUS">ORDER_STATUS</option>
            <option value="PRODUCT_CREATE">PRODUCT_CREATE</option>
            <option value="PRODUCT_UPDATE">PRODUCT_UPDATE</option>
            <option value="PRODUCT_DELETE">PRODUCT_DELETE</option>
            <option value="MEDIA_UPLOAD">MEDIA_UPLOAD</option>
            <option value="BACKUP_EXPORT">BACKUP_EXPORT</option>
            <option value="RESTORE_APPLY">RESTORE_APPLY</option>
            <option value="SQL_QUERY">SQL_QUERY</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-[#0B0F19] border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900/80 text-slate-400 font-medium border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-3 py-3">Action Type</th>
                <th className="px-3 py-3">Actor</th>
                <th className="px-3 py-3">Entity ID</th>
                <th className="px-4 py-3">Operation Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action_type === 'AUTH'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : log.action_type.startsWith('ORDER')
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : log.action_type.startsWith('PRODUCT')
                          ? 'bg-sky-950 text-sky-300 border border-sky-800'
                          : log.action_type.startsWith('BACKUP') || log.action_type.startsWith('RESTORE')
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-900 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {log.action_type}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-300 font-sans text-xs">{log.actor}</td>
                  <td className="px-3 py-3 text-purple-400">{log.entity_id}</td>
                  <td className="px-4 py-3 text-slate-300 font-sans text-xs">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
