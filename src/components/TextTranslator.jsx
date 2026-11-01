import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowRightLeft,
  Volume2,
  VolumeX,
  Square,
  Copy,
  Check,
  Mic,
  MicOff,
  X,
  Sparkles,
  ClipboardPaste,
  Download,
  Star,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { LANGUAGES, POPULAR_LANGUAGES, getLanguageByCode } from '../constants/languages';
import { translateText, speakText, stopSpeaking, createSpeechRecognizer } from '../services/translator';
import LanguageSelectorModal from './LanguageSelectorModal';

export default function TextTranslator({
  apiKey,
  autoTranslate = true,
  onSaveToHistory,
  onShowToast,
  restoredItem,
}) {
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('ar');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [detectedLang, setDetectedLang] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [tone, setTone] = useState('standard');
  const [alternatives, setAlternatives] = useState([]);
  const [aiNotes, setAiNotes] = useState('');

  // Audio Playback states
  const [speakingField, setSpeakingField] = useState(null); // 'source' | 'target' | null

  // Modals state
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  // Speech Recognition Ref
  const recognitionRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Restore item from history if triggered
  useEffect(() => {
    if (restoredItem && restoredItem.type === 'text') {
      setSourceText(restoredItem.sourceText || '');
      setTranslatedText(restoredItem.translatedText || '');
      setSourceLang(restoredItem.sourceLang || 'auto');
      setTargetLang(restoredItem.targetLang || 'ar');
      setIsFavorited(Boolean(restoredItem.favorite));
    }
  }, [restoredItem]);

  // Main translation function
  const handleTranslate = useCallback(
    async (textToTranslate = sourceText, sLang = sourceLang, tLang = targetLang, currentTone = tone) => {
      if (!textToTranslate || !textToTranslate.trim()) {
        setTranslatedText('');
        setDetectedLang(null);
        setAlternatives([]);
        setAiNotes('');
        return;
      }

      setIsLoading(true);
      try {
        const result = await translateText({
          text: textToTranslate,
          sourceLang: sLang,
          targetLang: tLang,
          apiKey,
          tone: currentTone,
        });

        setTranslatedText(result.translatedText);
        setDetectedLang(result.detectedLang);
        setAlternatives(result.alternatives || []);
        setAiNotes(result.notes || '');

        // Save to history
        if (onSaveToHistory) {
          onSaveToHistory({
            type: 'text',
            sourceText: textToTranslate,
            translatedText: result.translatedText,
            sourceLang: sLang === 'auto' && result.detectedLang ? result.detectedLang : sLang,
            targetLang: tLang,
            favorite: isFavorited,
          });
        }
      } catch (err) {
        console.error('Translation error:', err);
        if (onShowToast) onShowToast(err.message || 'حدث خطأ أثناء الترجمة', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [sourceText, sourceLang, targetLang, tone, apiKey, isFavorited, onSaveToHistory, onShowToast]
  );

  // Auto translate debounce
  useEffect(() => {
    if (!autoTranslate) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (sourceText.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        handleTranslate(sourceText, sourceLang, targetLang, tone);
      }, 600);
    } else {
      setTranslatedText('');
      setDetectedLang(null);
    }

    return () => clearTimeout(debounceTimerRef.current);
  }, [sourceText, sourceLang, targetLang, tone, autoTranslate, handleTranslate]);

  // Swap languages
  const handleSwapLanguages = () => {
    let newSource = targetLang;
    let newTarget = sourceLang === 'auto' ? detectedLang || 'en' : sourceLang;

    setSourceLang(newSource);
    setTargetLang(newTarget);
    setSourceText(translatedText);
    setTranslatedText(sourceText);

    if (translatedText.trim()) {
      handleTranslate(translatedText, newSource, newTarget, tone);
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setIsCopied(true);
    if (onShowToast) onShowToast('تم نسخ الترجمة إلى الحافظة');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setSourceText((prev) => (prev ? prev + ' ' + text : text));
        if (onShowToast) onShowToast('تم لصق النص من الحافظة');
      }
    } catch {
      if (onShowToast) onShowToast('يرجى السماح بالوصول إلى الحافظة', 'error');
    }
  };

  // Audio Playback Handler
  const handleSpeak = (text, lang, fieldName) => {
    if (!text || !text.trim()) return;

    // If already playing this field, stop it
    if (speakingField === fieldName) {
      handleStopAudio();
      return;
    }

    const langObj = getLanguageByCode(lang === 'auto' ? detectedLang || 'en' : lang);

    setSpeakingField(fieldName);
    speakText(text, langObj.code, {
      onStart: () => setSpeakingField(fieldName),
      onEnd: () => setSpeakingField(null),
      onError: () => setSpeakingField(null),
    });
  };

  // Explicit Stop Audio Handler
  const handleStopAudio = () => {
    stopSpeaking();
    setSpeakingField(null);
    if (onShowToast) onShowToast('تم إيقاف الصوت', 'info');
  };

  // Speech to Text (Microphone)
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const currentLangObj = getLanguageByCode(sourceLang === 'auto' ? 'ar' : sourceLang);
    const recognizer = createSpeechRecognizer(
      currentLangObj.speechCode || 'ar-SA',
      (transcript, isFinal) => {
        setSourceText(transcript);
        if (isFinal) {
          setIsListening(false);
          handleTranslate(transcript, sourceLang, targetLang, tone);
        }
      },
      (err) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
        if (onShowToast) onShowToast('تعذر استخدام الميكروفون أو تم رفض الإذن', 'error');
      },
      () => {
        setIsListening(false);
      }
    );

    if (!recognizer) {
      if (onShowToast) onShowToast('ميزة الإملاء الصوتي غير مدعومة في هذا المتصفح', 'info');
      return;
    }

    try {
      recognizer.start();
      recognitionRef.current = recognizer;
      setIsListening(true);
      if (onShowToast) onShowToast('تحدث الآن... جارٍ الاستماع', 'info');
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  // Export translated text
  const handleDownload = () => {
    if (!translatedText) return;
    const blob = new Blob([translatedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `translation-${targetLang}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast('تم تنزيل ملف الترجمة');
  };

  const sourceLangObj = getLanguageByCode(sourceLang);
  const targetLangObj = getLanguageByCode(targetLang);
  const detectedLangObj = detectedLang ? getLanguageByCode(detectedLang) : null;

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
      {/* Top Language Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 shadow-sm border border-slate-200/80 dark:border-slate-800 mb-3 sm:mb-4 transition-colors">
        <div className="flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Source Lang Select */}
          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            <button
              onClick={() => setIsSourceModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs sm:text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition truncate"
            >
              <span className="text-base sm:text-lg">{sourceLangObj.flag}</span>
              <span className="truncate">{sourceLangObj.name}</span>
              <span className="text-[10px] text-slate-400 shrink-0">▼</span>
            </button>

            {/* Quick chips (Tablet & Desktop) */}
            <div className="hidden lg:flex items-center gap-1 shrink-0">
              <button
                onClick={() => setSourceLang('auto')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                  sourceLang === 'auto'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                تلقائي
              </button>
              {POPULAR_LANGUAGES.slice(0, 3).map((code) => {
                const lang = getLanguageByCode(code);
                return (
                  <button
                    key={code}
                    onClick={() => setSourceLang(code)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                      sourceLang === code
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {lang.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwapLanguages}
            title="تبديل لغة المصدر والهدف"
            aria-label="تبديل اللغات"
            className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 hover:rotate-180 transition-all duration-300 shrink-0"
          >
            <ArrowRightLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Target Lang Select */}
          <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
            {/* Quick chips (Desktop) */}
            <div className="hidden lg:flex items-center gap-1 shrink-0">
              {POPULAR_LANGUAGES.slice(0, 3).map((code) => {
                const lang = getLanguageByCode(code);
                return (
                  <button
                    key={code}
                    onClick={() => setTargetLang(code)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                      targetLang === code
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {lang.name}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIsTargetModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold text-xs sm:text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition border border-blue-200 dark:border-blue-900 truncate"
            >
              <span className="text-base sm:text-lg">{targetLangObj.flag}</span>
              <span className="truncate">{targetLangObj.name}</span>
              <span className="text-[10px] text-blue-400 shrink-0">▼</span>
            </button>
          </div>
        </div>

        {/* AI Tone selector if API Key available */}
        {apiKey && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px] sm:text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>نبرة وأسلوب الترجمة:</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-full">
              {[
                { id: 'standard', label: 'قياسي' },
                { id: 'formal', label: 'رسمي' },
                { id: 'casual', label: 'عفوي' },
                { id: 'poetic', label: 'أدبي' },
                { id: 'business', label: 'أعمال' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`px-2 py-1 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap transition ${
                    tone === t.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Dual Translation Box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Source Text Box */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col min-h-[260px] sm:min-h-[340px] transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
          {/* Header indicator */}
          <div className="flex items-center justify-between mb-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {sourceLang === 'auto' ? 'كشف اللغة التلقائي' : sourceLangObj.name}
              </span>
              {detectedLang && sourceLang === 'auto' && (
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">
                  تم اكتشاف: {detectedLangObj?.name || detectedLang}
                </span>
              )}
            </div>

            {sourceText && (
              <button
                onClick={() => setSourceText('')}
                className="text-slate-400 hover:text-red-500 transition p-1"
                title="مسح النص"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Textarea */}
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="اكتب أو الصق النص هنا للترجمة إلى أي لغة..."
            dir="auto"
            className="w-full flex-1 bg-transparent resize-none border-none focus:outline-none text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-relaxed placeholder-slate-400 font-normal min-h-[140px]"
          />

          {/* Bottom Toolbar for Source */}
          <div className="pt-3 sm:pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Play Pronunciation TTS */}
              <button
                onClick={() => handleSpeak(sourceText, sourceLang, 'source')}
                disabled={!sourceText}
                title="استمع لنطق النص"
                className={`p-2 sm:p-2.5 rounded-xl transition ${
                  speakingField === 'source'
                    ? 'bg-blue-600 text-white animate-pulse shadow-sm'
                    : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30'
                }`}
              >
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Extra Dedicated STOP Audio Button */}
              <button
                onClick={handleStopAudio}
                disabled={speakingField !== 'source'}
                title="إيقاف نطق الصوت"
                className={`p-2 sm:p-2.5 rounded-xl transition flex items-center gap-1 ${
                  speakingField === 'source'
                    ? 'bg-red-500 text-white shadow-sm hover:bg-red-600'
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30'
                }`}
              >
                <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                <span className="hidden sm:inline text-[11px] font-bold">إيقاف</span>
              </button>

              {/* Microphone Voice Input */}
              <button
                onClick={toggleListening}
                title={isListening ? 'إيقاف التسجيل الصوتي' : 'إملاء صوتي بالميكروفون'}
                className={`p-2 sm:p-2.5 rounded-xl transition ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

              {/* Paste button */}
              <button
                onClick={handlePaste}
                title="لصق من الحافظة"
                className="p-2 sm:p-2.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <ClipboardPaste className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-[11px] sm:text-xs text-slate-400 font-mono">
                {sourceText.length} حرف
              </span>

              {!autoTranslate && (
                <button
                  onClick={() => handleTranslate()}
                  disabled={isLoading || !sourceText.trim()}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>ترجم</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Target Text Box */}
        <div className="bg-slate-50/70 dark:bg-slate-900/70 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col min-h-[260px] sm:min-h-[340px] relative transition-all">
          {/* Header indicator */}
          <div className="flex items-center justify-between mb-2 text-xs">
            <div className="flex items-center gap-1.5 sm:gap-2 font-semibold text-slate-700 dark:text-slate-300">
              <span>{targetLangObj.name}</span>
              {apiKey && (
                <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  Gemini
                </span>
              )}
            </div>

            {isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">جاري الترجمة الفورية...</span>
              </div>
            )}
          </div>

          {/* Translation Result Area */}
          <div className="flex-1 overflow-y-auto min-h-[140px]">
            {translatedText ? (
              <div
                dir={targetLangObj.dir || 'auto'}
                className="text-slate-900 dark:text-slate-50 text-sm sm:text-base leading-relaxed font-normal select-text break-words"
              >
                {translatedText}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-xs sm:text-sm py-8">
                <span>ستظهر الترجمة هنا مباشرة وبدقة عالية</span>
              </div>
            )}

            {/* AI Notes / Alternatives */}
            {aiNotes && (
              <div className="mt-3 p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-800 dark:text-indigo-300">
                <div className="font-bold mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>إضاءة سياقية من الذكاء الاصطناعي:</span>
                </div>
                <div>{aiNotes}</div>
              </div>
            )}

            {alternatives.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-[10px] sm:text-[11px] text-slate-400 self-center">اقتراحات:</span>
                {alternatives.map((alt, i) => (
                  <span
                    key={i}
                    onClick={() => setTranslatedText(alt)}
                    className="px-2 py-0.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400 cursor-pointer transition"
                  >
                    {alt}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Toolbar for Target */}
          <div className="pt-3 sm:pt-4 mt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Play Pronunciation TTS */}
              <button
                onClick={() => handleSpeak(translatedText, targetLang, 'target')}
                disabled={!translatedText}
                title="استمع لنطق الترجمة"
                className={`p-2 sm:p-2.5 rounded-xl transition ${
                  speakingField === 'target'
                    ? 'bg-blue-600 text-white animate-pulse shadow-sm'
                    : 'text-slate-500 hover:text-blue-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-30'
                }`}
              >
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Extra Dedicated STOP Audio Button */}
              <button
                onClick={handleStopAudio}
                disabled={speakingField !== 'target'}
                title="إيقاف نطق الصوت"
                className={`p-2 sm:p-2.5 rounded-xl transition flex items-center gap-1 ${
                  speakingField === 'target'
                    ? 'bg-red-500 text-white shadow-sm hover:bg-red-600'
                    : 'text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-30'
                }`}
              >
                <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                <span className="hidden sm:inline text-[11px] font-bold">إيقاف</span>
              </button>

              {/* Copy to Clipboard */}
              <button
                onClick={handleCopy}
                disabled={!translatedText}
                title="نسخ الترجمة"
                className="p-2 sm:p-2.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-30 transition relative"
              >
                {isCopied ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" /> : <Copy className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

              {/* Favorite */}
              <button
                onClick={() => {
                  setIsFavorited(!isFavorited);
                  if (onShowToast) onShowToast(!isFavorited ? 'تمت الإضافة للمفضلة' : 'تمت الإزالة من المفضلة');
                }}
                disabled={!translatedText}
                title="إضافة للمفضلة"
                className={`p-2 sm:p-2.5 rounded-xl disabled:opacity-30 transition ${
                  isFavorited
                    ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                    : 'text-slate-500 hover:text-amber-500 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorited ? 'fill-current' : ''}`} />
              </button>

              {/* Download */}
              <button
                onClick={handleDownload}
                disabled={!translatedText}
                title="تنزيل الترجمة كملف نصي (.txt)"
                className="p-2 sm:p-2.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-30 transition"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <span className="text-[11px] sm:text-xs text-slate-400 font-mono">
              {translatedText.length} حرف
            </span>
          </div>
        </div>
      </div>

      {/* Language Modals */}
      <LanguageSelectorModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        selectedCode={sourceLang}
        onSelect={(code) => setSourceLang(code)}
        isSource={true}
        title="اختر لغة النص الأصلي (المصدر)"
      />

      <LanguageSelectorModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        selectedCode={targetLang}
        onSelect={(code) => setTargetLang(code)}
        isSource={false}
        title="اختر لغة الترجمة المطلوبة (الهدف)"
      />
    </div>
  );
}
