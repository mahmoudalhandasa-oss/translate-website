import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TextTranslator from './components/TextTranslator';
import ImageTranslator from './components/ImageTranslator';
import HistoryDrawer from './components/HistoryDrawer';
import SettingsModal from './components/SettingsModal';
import Toast from './components/Toast';
import { Globe, Sparkles, ShieldCheck, Zap, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('text'); // 'text', 'image', 'history'
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('translate_theme') === 'dark' ||
      (!('translate_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('translate_api_key') || '');
  const [autoTranslate, setAutoTranslate] = useState(() => {
    const saved = localStorage.getItem('translate_auto_live');
    return saved !== null ? saved === 'true' : true;
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('translate_history_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toast, setToast] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [restoredItem, setRestoredItem] = useState(null);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('translate_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('translate_theme', 'light');
    }
  }, [darkMode]);

  // Sync history to localStorage
  useEffect(() => {
    localStorage.setItem('translate_history_items', JSON.stringify(history));
  }, [history]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Add item to history
  const handleSaveToHistory = (item) => {
    if (!item.sourceText || !item.translatedText) return;
    setHistory((prev) => {
      // Check if duplicate of latest item
      if (prev.length > 0 && prev[0].sourceText === item.sourceText && prev[0].targetLang === item.targetLang) {
        return prev;
      }
      const newItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        ...item,
      };
      // Keep up to 100 items
      return [newItem, ...prev.slice(0, 99)];
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    showToast('تم مسح السجل بنجاح');
  };

  const handleToggleFavorite = (id) => {
    setHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item))
    );
  };

  const handleDeleteHistoryItem = (id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    showToast('تم حذف العنصر من السجل');
  };

  const handleRestoreItem = (item) => {
    setRestoredItem(item);
    if (item.type === 'image') {
      setActiveTab('image');
    } else {
      setActiveTab('text');
    }
    showToast('تمت استعادة الترجمة إلى نافذة العمل');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        historyCount={history.length}
        hasApiKey={Boolean(apiKey)}
      />

      {/* Main Content View */}
      <main className="flex-1 pb-16">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-18 inset-x-0 h-64 bg-gradient-to-b from-blue-500/5 via-indigo-500/5 to-transparent pointer-events-none -z-10"></div>

        {activeTab === 'text' && (
          <TextTranslator
            apiKey={apiKey}
            autoTranslate={autoTranslate}
            onSaveToHistory={handleSaveToHistory}
            onShowToast={showToast}
            restoredItem={restoredItem}
          />
        )}

        {activeTab === 'image' && (
          <ImageTranslator
            apiKey={apiKey}
            onSaveToHistory={handleSaveToHistory}
            onShowToast={showToast}
            restoredItem={restoredItem}
          />
        )}

        {activeTab === 'history' && (
          <HistoryDrawer
            history={history}
            onClearHistory={handleClearHistory}
            onToggleFavorite={handleToggleFavorite}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onRestoreItem={handleRestoreItem}
            onShowToast={showToast}
          />
        )}

        {/* Feature Badges Footer section on home tabs */}
        {activeTab !== 'history' && (
          <div className="max-w-5xl mx-auto px-4 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t border-slate-200/60 dark:border-slate-800/80">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">أكثر من 100 لغة</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">ترجمة دقيقة وشاملة لجميع لغات العالم</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">ترجمة صور وفورية</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">محرك OCR متقدم لقراءة نصوص الصور بالكاميرا والحافظة</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">خصوصية وأمان 100%</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">تتم معالجة الصور وقراءتها مباشرة على متصفحك</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 font-medium">
            <span>ترجمان الذكي &copy; 2026 — منصة ترجمة النصوص والصور الفورية</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>صُنع بإتقان برياكت وتلويند سي اس اس</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-current inline mx-0.5" />
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        autoTranslate={autoTranslate}
        setAutoTranslate={setAutoTranslate}
        onShowToast={showToast}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
