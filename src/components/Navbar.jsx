import React from 'react';
import {
  Languages,
  Image as ImageIcon,
  History,
  Settings,
  Moon,
  Sun,
  Sparkles,
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  onOpenSettings,
  historyCount = 0,
  hasApiKey = false,
}) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white shadow-md shadow-blue-500/20 shrink-0">
            <Languages className="w-5 h-5 sm:w-6 sm:h-6" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-base sm:text-xl font-black bg-gradient-to-l from-blue-600 via-indigo-500 to-sky-500 bg-clip-text text-transparent">
                ترجمان الذكي
              </span>
              {hasApiKey ? (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
                  <Sparkles className="w-2.5 h-2.5" />
                  AI
                </span>
              ) : null}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hidden md:block">
              مترجم نصوص وصور فوري لجميع لغات العالم
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Mobile & Desktop) */}
        <nav className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1 sm:p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'text'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Languages className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">النصوص</span>
            <span className="xs:hidden">نصوص</span>
          </button>

          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'image'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">الصور</span>
            <span className="xs:hidden">صور</span>
            <span className="hidden sm:inline px-1.5 py-0.2 text-[10px] font-extrabold rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              OCR
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all relative ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">السجل</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold rounded-full bg-blue-600 text-white leading-none">
                {historyCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Actions: Theme Toggle & Settings */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'التبديل إلى الوضع الفاتح (النهاري)' : 'التبديل إلى الوضع الليلي'}
            aria-label="تبديل المظهر الليلي والنهاري"
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 shadow-xs"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            title="الإعدادات والذكاء الاصطناعي"
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 shadow-xs"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
