import React, { useState } from 'react';
import {
  History,
  Star,
  Trash2,
  Copy,
  ExternalLink,
  Search,
  Check,
  Languages,
  Image as ImageIcon,
} from 'lucide-react';
import { getLanguageByCode } from '../constants/languages';

export default function HistoryDrawer({
  history = [],
  onClearHistory,
  onToggleFavorite,
  onDeleteHistoryItem,
  onRestoreItem,
  onShowToast,
}) {
  const [filter, setFilter] = useState('all'); // 'all', 'favorites', 'image', 'text'
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const filteredItems = history.filter((item) => {
    if (filter === 'favorites' && !item.favorite) return false;
    if (filter === 'image' && item.type !== 'image') return false;
    if (filter === 'text' && item.type !== 'text') return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.sourceText?.toLowerCase().includes(q) ||
      item.translatedText?.toLowerCase().includes(q)
    );
  });

  const handleCopy = (e, text, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (onShowToast) onShowToast('تم نسخ الترجمة للحافظة');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <History className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>سجل الترجمات والمفضلة</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            جميع نصوصك وترجمات صورك محفوظة محلياً في جهازك بخصوصية تامة
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('هل أنت متأكد من مسح جميع السجلات؟')) {
                onClearHistory();
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>مسح السجل بالكامل</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 mb-6">
        {/* Filter Chips */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            الكل ({history.length})
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              filter === 'favorites'
                ? 'bg-white dark:bg-slate-900 text-amber-500 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>المفضلة</span>
          </button>
          <button
            onClick={() => setFilter('image')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              filter === 'image'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>الصور</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في الكلمات المترجمة..."
            className="w-full pr-9 pl-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 opacity-60" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base mb-1">
            لا توجد ترجمات محفوظة حالياً
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            ستظهر هنا كل النصوص والصور التي تقوم بترجمتها، ويمكنك تمييز أهمها بنجمة للرجوع إليها لاحقاً بدون إنترنت.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const srcObj = getLanguageByCode(item.sourceLang);
            const tgtObj = getLanguageByCode(item.targetLang);

            return (
              <div
                key={item.id}
                onClick={() => onRestoreItem(item)}
                className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-900 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {item.type === 'image' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <ImageIcon className="w-3 h-3" />
                        ترجمة صورة
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        <Languages className="w-3 h-3" />
                        ترجمة نص
                      </span>
                    )}

                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>{srcObj.flag} {srcObj.name}</span>
                      <span>←</span>
                      <span>{tgtObj.flag} {tgtObj.name}</span>
                    </div>

                    <span className="text-[11px] text-slate-400 dark:text-slate-500 mr-2">
                      {new Date(item.timestamp).toLocaleDateString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleFavorite(item.id)}
                      title={item.favorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                      className={`p-1.5 rounded-lg transition ${
                        item.favorite
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                          : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${item.favorite ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => handleCopy(e, item.translatedText, item.id)}
                      title="نسخ الترجمة"
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => onDeleteHistoryItem(item.id)}
                      title="حذف هذا العنصر"
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content side-by-side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-normal line-clamp-2" dir="auto">
                    {item.sourceText}
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 text-slate-900 dark:text-white font-medium line-clamp-2" dir="auto">
                    {item.translatedText}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
