import React from 'react';
import { ShieldCheck, Globe, Database, HardDrive, LogOut, ExternalLink, Terminal } from 'lucide-react';
import { Language, TRANSLATIONS } from '../locales/translations';

interface HeaderProps {
  currentSection: string;
  lang: Language;
  onToggleLang: () => void;
  onLogout: () => void;
  onOpenSql: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  lang,
  onToggleLang,
  onLogout,
  onOpenSql
}) => {
  const t = TRANSLATIONS[lang];
  const sectionTitle = t.sections[currentSection as keyof typeof t.sections] || currentSection;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 h-16 px-6 bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-800/80">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-lg shadow-purple-900/20">
          <Database className="w-5 h-5 text-purple-100" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
            AIWebCrafter<span className="text-purple-400">.com</span>
          </span>
          <span className="text-[11px] text-slate-400 whitespace-nowrap">
            Private Store Cloud & Database
          </span>
        </div>
      </div>

      {/* Zone 2: Contextual Breadcrumb & System Telemetry */}
      <div className="hidden lg:flex items-center gap-4 text-xs text-slate-400">
        <span className="text-slate-300 font-medium">{t.platformSubtitle}</span>
        <span className="text-slate-600" aria-hidden="true">/</span>
        <span className="text-purple-300 font-semibold">{sectionTitle}</span>
        <span className="text-slate-600" aria-hidden="true">·</span>
        <span className="text-emerald-400/90 font-mono flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero-Cost MAD Guaranteed</span>
        </span>
      </div>

      {/* Zone 3: Actions, Language Switch & Owner Profile */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenSql}
          title="Open SQL Query Console"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5 text-purple-400" />
          <span>SQL Console</span>
        </button>

        <button
          onClick={onToggleLang}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-700/70 border border-slate-700/60 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-purple-400" />
          <span>{t.languageToggle}</span>
        </button>

        <div className="h-5 w-px bg-slate-800 hidden sm:block" />

        <div className="flex items-center gap-2 pl-1">
          <div className="w-7 h-7 rounded-full bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-xs font-semibold text-purple-300">
            OW
          </div>
          <button
            onClick={onLogout}
            title={t.logout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
