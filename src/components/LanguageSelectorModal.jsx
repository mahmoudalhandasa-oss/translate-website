import React, { useState, useMemo } from 'react';
import { Search, X, Check, Globe } from 'lucide-react';
import { LANGUAGES, POPULAR_LANGUAGES } from '../constants/languages';

export default function LanguageSelectorModal({
  isOpen,
  onClose,
  selectedCode,
  onSelect,
  isSource = false,
  title = 'اختر اللغة',
}) {
  const [search, setSearch] = useState('');

  const filteredLanguages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return LANGUAGES.filter((l) => {
      // Disallow 'auto' on target language
      if (!isSource && l.code === 'auto') return false;

      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        l.native.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
      );
    });
  }, [search, isSource]);

  const popularList = useMemo(() => {
    return POPULAR_LANGUAGES.map((code) =>
      LANGUAGES.find((l) => l.code === code)
    ).filter(Boolean);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-right"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                يدعم أكثر من 100 لغة حول العالم
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم اللغة بالعربية أو الإنجليزية..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Popular Chips */}
          {!search && (
            <div className="mt-3">
              <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2">
                اللغات الأكثر شيوعاً:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {isSource && (
                  <button
                    onClick={() => {
                      onSelect('auto');
                      onClose();
                    }}
                    className={`px-3 py-1 text-xs rounded-full border transition flex items-center gap-1 ${
                      selectedCode === 'auto'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    <span>🌐</span>
                    <span>تلقائي</span>
                  </button>
                )}
                {popularList.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onSelect(lang.code);
                      onClose();
                    }}
                    className={`px-3 py-1 text-xs rounded-full border transition flex items-center gap-1 ${
                      selectedCode === lang.code
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/50">
          {filteredLanguages.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
              لم يتم العثور على لغة مطابقة لـ "{search}"
            </div>
          ) : (
            filteredLanguages.map((lang) => {
              const isSelected = selectedCode === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    onSelect(lang.code);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition text-right group ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                      : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl leading-none">{lang.flag}</span>
                    <div>
                      <div className="text-sm font-medium">{lang.name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                        {lang.native} ({lang.code})
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="p-1 rounded-full bg-blue-600 text-white">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
