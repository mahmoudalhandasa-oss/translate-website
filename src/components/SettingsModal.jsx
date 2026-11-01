import React, { useState } from 'react';
import {
  X,
  Key,
  Sparkles,
  ExternalLink,
  Save,
  CheckCircle2,
  Trash2,
  Cpu,
} from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  apiKey,
  setApiKey,
  autoTranslate,
  setAutoTranslate,
  onShowToast,
}) {
  const [tempKey, setTempKey] = useState(apiKey || '');
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiKey(tempKey.trim());
    localStorage.setItem('translate_api_key', tempKey.trim());
    if (onShowToast) {
      onShowToast(tempKey.trim() ? 'تم حفظ مفتاح الذكاء الاصطناعي بنجاح' : 'تم مسح مفتاح الذكاء الاصطناعي');
    }
    onClose();
  };

  const handleClear = () => {
    setTempKey('');
    setApiKey('');
    localStorage.removeItem('translate_api_key');
    if (onShowToast) onShowToast('تمت إزالة المفتاح، الموقع يعمل الآن بمحرك الترجمة المجاني الفوري');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-right"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                إعدادات المترجم والذكاء الاصطناعي
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                خصص تجربة الترجمة ومحركات الذكاء الاصطناعي
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

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Gemini AI Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-blue-50/50 to-purple-50/30 dark:from-indigo-950/30 dark:via-blue-950/20 dark:to-purple-950/10 border border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  محرك الذكاء الاصطناعي المتطور (Gemini 1.5 Flash)
                </span>
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full">
                اختياري
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              الموقع يعمل بشكل افتراضي ومجاني 100% بدون أي مفتاح عبر محركات الترجمة السريعة لجميع اللغات.
              إذا أردت دقة سياقية فائقة، وتحديد النبرة (رسمي، ودي، أدبي، أعمال) أو ترجمة فورية فائقة الدقة للصور المعقدة، يمكنك إضافة مفتاحك الخاص.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>مفتاح Gemini API:</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>احصل على مفتاح مجاني من Google</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </label>

              <div className="relative">
                <Key className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showKey ? 'text' : 'password'}
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full pr-9 pl-20 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  {showKey ? 'إخفاء' : 'إظهار'}
                </button>
              </div>
            </div>

            {apiKey && (
              <div className="mt-3 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  محرك الذكاء الاصطناعي نشط وجاهز
                </span>
                <button
                  onClick={handleClear}
                  className="text-red-500 hover:text-red-700 p-1 flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>
              </div>
            )}
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              تفضيلات الترجمة
            </h4>

            {/* Auto Translate Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  الترجمة الفورية التلقائية
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  ترجمة النص تلقائياً أثناء كتابتك مع توقف طفيف
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoTranslate}
                  onChange={(e) => {
                    setAutoTranslate(e.target.checked);
                    localStorage.setItem('translate_auto_live', String(e.target.checked));
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition"
          >
            <Save className="w-4 h-4" />
            <span>حفظ الإعدادات</span>
          </button>
        </div>
      </div>
    </div>
  );
}
