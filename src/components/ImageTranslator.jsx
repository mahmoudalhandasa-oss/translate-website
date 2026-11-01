import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Volume2,
  Copy,
  Check,
  RefreshCw,
  X,
  Sliders,
  Eye,
  Columns,
  Layers,
  ArrowRightLeft,
  Download,
  AlertCircle,
  FileText,
  Star,
} from 'lucide-react';
import { LANGUAGES, POPULAR_LANGUAGES, getLanguageByCode } from '../constants/languages';
import { extractTextWithTesseract, preprocessImage, extractAndTranslateWithGemini } from '../services/ocr';
import { translateText, speakText } from '../services/translator';
import { SAMPLE_PRESETS, generateSampleImage } from '../constants/samples';
import LanguageSelectorModal from './LanguageSelectorModal';

export default function ImageTranslator({
  apiKey,
  onSaveToHistory,
  onShowToast,
  restoredItem,
}) {
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('ar');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [processedPreview, setProcessedPreview] = useState(null);
  const [applyEnhance, setApplyEnhance] = useState(false);

  // OCR & Translation states
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressState, setProgressState] = useState({ progress: 0, message: '' });
  const [extractedText, setExtractedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [detectedLang, setDetectedLang] = useState(null);
  const [ocrConfidence, setOcrConfidence] = useState(null);

  // UI display mode: 'split' (side by side), 'overlay' (on top of image)
  const [viewMode, setViewMode] = useState('split');
  const [isCopied, setIsCopied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Camera capture state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Modals
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  const fileInputRef = useRef(null);

  // Restore item if requested
  useEffect(() => {
    if (restoredItem && restoredItem.type === 'image') {
      setExtractedText(restoredItem.sourceText || '');
      setTranslatedText(restoredItem.translatedText || '');
      setSourceLang(restoredItem.sourceLang || 'auto');
      setTargetLang(restoredItem.targetLang || 'ar');
      setIsFavorited(Boolean(restoredItem.favorite));
    }
  }, [restoredItem]);

  // Handle Clipboard Paste (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageSelected(file);
            if (onShowToast) onShowToast('تم لصق الصورة من الحافظة');
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // When an image file is selected or dropped
  const handleImageSelected = async (file) => {
    if (!file) return;
    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Reset results
    setExtractedText('');
    setTranslatedText('');
    setOcrConfidence(null);
    setProcessedPreview(null);

    // Pre-generate enhanced version in background
    try {
      const enhanced = await preprocessImage(file, { grayscale: true, contrast: 1.3 });
      setProcessedPreview(enhanced);
    } catch (e) {
      console.warn('Enhancement error:', e);
    }
  };

  // Run the OCR and Translation pipeline
  const processImage = useCallback(async () => {
    if (!imageFile && !imagePreview) return;

    setIsProcessing(true);
    setProgressState({ progress: 10, message: 'بدء معالجة الصورة...' });

    try {
      // 1. If Gemini API Key exists, we can use Gemini Vision for incredible OCR + translation
      if (apiKey && apiKey.trim().length > 10 && imageFile instanceof File) {
        setProgressState({ progress: 30, message: 'جاري التحليل بالذكاء الاصطناعي (Gemini Vision)...' });
        const geminiRes = await extractAndTranslateWithGemini({
          imageFile,
          targetLang,
          apiKey,
        });

        setExtractedText(geminiRes.extractedText);
        setTranslatedText(geminiRes.translatedText);
        setDetectedLang(geminiRes.detectedLanguage);
        setOcrConfidence(98);

        if (onSaveToHistory) {
          onSaveToHistory({
            type: 'image',
            sourceText: geminiRes.extractedText,
            translatedText: geminiRes.translatedText,
            sourceLang: geminiRes.detectedLanguage || sourceLang,
            targetLang,
            favorite: isFavorited,
          });
        }

        setProgressState({ progress: 100, message: 'اكتملت الترجمة بنجاح!' });
        if (onShowToast) onShowToast('تمت ترجمة الصورة بنجاح بواسطة الذكاء الاصطناعي');
        setIsProcessing(false);
        return;
      }

      // 2. Client-side OCR via Tesseract.js (Zero setup required, works offline / client side!)
      const imageToOcr = applyEnhance && processedPreview ? processedPreview : imagePreview;

      setProgressState({ progress: 20, message: 'تهيئة محرك استخراج النصوص (OCR)...' });

      const ocrResult = await extractTextWithTesseract({
        imageSource: imageToOcr,
        sourceLang: sourceLang === 'auto' ? 'ara+eng' : sourceLang,
        onProgress: (p) => setProgressState(p),
      });

      const extracted = ocrResult.text.trim();
      setExtractedText(extracted);
      setOcrConfidence(ocrResult.confidence);

      if (!extracted) {
        throw new Error('لم يتم العثور على نصوص واضحة في الصورة. جرب تفعيل "تحسين التباين" أو اختيار صورة أكثر وضوحاً.');
      }

      // 3. Translate extracted text
      setProgressState({ progress: 85, message: 'جاري ترجمة النص المستخرج إلى اللغة المستهدفة...' });

      const transResult = await translateText({
        text: extracted,
        sourceLang,
        targetLang,
        apiKey,
      });

      setTranslatedText(transResult.translatedText);
      setDetectedLang(transResult.detectedLang);
      setProgressState({ progress: 100, message: 'اكتملت الترجمة بنجاح!' });

      if (onSaveToHistory) {
        onSaveToHistory({
          type: 'image',
          sourceText: extracted,
          translatedText: transResult.translatedText,
          sourceLang: sourceLang === 'auto' && transResult.detectedLang ? transResult.detectedLang : sourceLang,
          targetLang,
          favorite: isFavorited,
        });
      }

      if (onShowToast) onShowToast('تم استخراج وترجمة نصوص الصورة بنجاح');
    } catch (err) {
      console.error('Image translation error:', err);
      if (onShowToast) onShowToast(err.message || 'حدث خطأ أثناء معالجة الصورة', 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [imageFile, imagePreview, applyEnhance, processedPreview, apiKey, sourceLang, targetLang, isFavorited, onSaveToHistory, onShowToast]);

  // Re-translate if extracted text was manually edited
  const handleReTranslateExtracted = async () => {
    if (!extractedText.trim()) return;
    setIsProcessing(true);
    try {
      const res = await translateText({
        text: extractedText,
        sourceLang,
        targetLang,
        apiKey,
      });
      setTranslatedText(res.translatedText);
      if (onShowToast) onShowToast('تم تحديث الترجمة');
    } catch (err) {
      if (onShowToast) onShowToast('فشلت إعادة الترجمة', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Load a preset sample image
  const handleLoadSample = (sampleId) => {
    const dataUrl = generateSampleImage(sampleId);
    setImagePreview(dataUrl);

    // Convert dataURL to Blob/File
    fetch(dataUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `${sampleId}-sample.png`, { type: 'image/png' });
        setImageFile(file);
      });

    setExtractedText('');
    setTranslatedText('');
    setOcrConfidence(null);
    if (onShowToast) onShowToast('تم تحميل النموذج التجريبي، اضغط "ابدأ الترجمة"');
  };

  // Camera Feed Management
  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setIsCameraOpen(false);
      if (onShowToast) onShowToast('تعذر فتح الكاميرا، يرجى السماح بالأذونات', 'error');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      handleImageSelected(file);
      closeCamera();
    }, 'image/jpeg', 0.95);
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  // Copy translated text
  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setIsCopied(true);
    if (onShowToast) onShowToast('تم نسخ الترجمة للحافظة');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Download
  const handleDownload = () => {
    if (!translatedText) return;
    const content = `--- النص المستخرج من الصورة ---\n${extractedText}\n\n--- الترجمة (${targetLangObj.name}) ---\n${translatedText}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `image-translation-${targetLang}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast('تم تنزيل ملف الترجمة');
  };

  const sourceLangObj = getLanguageByCode(sourceLang);
  const targetLangObj = getLanguageByCode(targetLang);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      {/* Language Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-3 shadow-sm border border-slate-200/80 dark:border-slate-800 mb-6 transition-colors">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Source Lang */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              لغة الصورة:
            </span>
            <button
              onClick={() => setIsSourceModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <span>{sourceLangObj.flag}</span>
              <span>{sourceLangObj.name}</span>
              <span className="text-xs text-slate-400">▼</span>
            </button>
          </div>

          {/* Swap */}
          <button
            onClick={() => {
              if (sourceLang === 'auto') {
                setSourceLang(targetLang);
                setTargetLang('ar');
              } else {
                const temp = sourceLang;
                setSourceLang(targetLang);
                setTargetLang(temp);
              }
            }}
            title="تبديل اللغات"
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          {/* Target Lang */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              الترجمة إلى:
            </span>
            <button
              onClick={() => setIsTargetModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition border border-blue-200 dark:border-blue-900"
            >
              <span>{targetLangObj.flag}</span>
              <span>{targetLangObj.name}</span>
              <span className="text-xs text-blue-400">▼</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      {!imagePreview ? (
        /* Empty / Upload View */
        <div className="space-y-6">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleImageSelected(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className="group relative bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 p-12 text-center cursor-pointer transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col items-center justify-center min-h-[360px]"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleImageSelected(e.target.files[0])}
              accept="image/*"
              className="hidden"
            />

            <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Upload className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              اسحب وأفلت أي صورة هنا للترجمة الفورية
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
              يدعم قراءة وترجمة النصوص من اللوحات الإرشادية، قوائم الطعام، الوثائق، الكتب، الشاشات، ولقطات الشاشة (PNG, JPG, WEBP)
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition"
              >
                <ImageIcon className="w-4 h-4" />
                <span>اختيار صورة من جهازك</span>
              </button>

              <button
                type="button"
                onClick={startCamera}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-sm transition"
              >
                <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>التقاط بالكاميرا</span>
              </button>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>يمكنك أيضاً لصق أي لقطة شاشة مباشرة بالضغط على <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">Ctrl + V</kbd></span>
            </div>
          </div>

          {/* Quick Presets / Sample Images */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  نماذج تجريبية سريعة (جرب بدون صور من جهازك):
                </h4>
              </div>
              <span className="text-xs text-slate-400">اضغط لتجربة دقة المحرك فورياً</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleLoadSample(preset.id)}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700/80 hover:border-blue-400 transition text-right group flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {preset.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      انقر للتحميل والتجربة
                    </div>
                  </div>
                  <span className="text-2xl">{preset.flag}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Image Loaded & Processing View */
        <div className="space-y-6">
          {/* Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setImagePreview(null);
                  setImageFile(null);
                  setExtractedText('');
                  setTranslatedText('');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
                <span>إزالة الصورة</span>
              </button>

              {/* Enhance Contrast Filter Toggle */}
              <button
                onClick={() => setApplyEnhance(!applyEnhance)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  applyEnhance
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
                title="تطبيق فلتر لزيادة وضوح الحروف للصور الصعبة"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>تحسين التباين والحواف (OCR Boost)</span>
              </button>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('split')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    viewMode === 'split'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>جنباً إلى جنب</span>
                </button>
                <button
                  onClick={() => setViewMode('overlay')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    viewMode === 'overlay'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>ملصق فوق الصورة</span>
                </button>
              </div>

              {/* Start / Re-process button */}
              <button
                onClick={processImage}
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 disabled:opacity-50 transition"
              >
                <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>{translatedText ? 'إعادة المعالجة' : 'ابدأ الترجمة واستخراج النصوص'}</span>
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          {isProcessing && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-blue-200 dark:border-blue-900/60 shadow-md animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>{progressState.message || 'جاري معالجة الصورة...'}</span>
                </span>
                <span className="font-mono text-blue-600 font-bold">{progressState.progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-400 transition-all duration-300"
                  style={{ width: `${progressState.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Result Content */}
          {viewMode === 'split' ? (
            /* Split / Side by Side Mode */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image Preview Box */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                    <ImageIcon className="w-4 h-4 text-blue-500" />
                    الصورة الأصلية
                  </span>
                  {applyEnhance && (
                    <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      فلتر التباين نشط
                    </span>
                  )}
                </div>

                <div className="relative flex-1 min-h-[360px] bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center p-2">
                  <img
                    src={applyEnhance && processedPreview ? processedPreview : imagePreview}
                    alt="Preview"
                    className="max-h-[500px] w-auto max-w-full object-contain rounded-xl"
                  />
                </div>
              </div>

              {/* Translation & Extracted Text Box */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  {/* Target Translated Result */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          الترجمة الفورية ({targetLangObj.name})
                        </span>
                        {ocrConfidence && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            دقة القراءة: {ocrConfidence}%
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => speakText(translatedText, targetLang)}
                          disabled={!translatedText}
                          title="استمع للنطق"
                          className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCopy}
                          disabled={!translatedText}
                          title="نسخ الترجمة"
                          className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
                        >
                          {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={handleDownload}
                          disabled={!translatedText}
                          title="تنزيل كنص"
                          className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div
                      dir={targetLangObj.dir || 'auto'}
                      className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-slate-900 dark:text-white text-base leading-relaxed min-h-[120px] select-text whitespace-pre-wrap font-medium"
                    >
                      {translatedText || (
                        <span className="text-slate-400 dark:text-slate-500 text-sm italic font-normal">
                          اضغط على زر "ابدأ الترجمة" لتحليل الصورة واستخراج الترجمة فورياً.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Editable Raw Extracted Text Box */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>النص المستخرج من الصورة (قابل للتعديل):</span>
                      </span>
                      {extractedText && (
                        <button
                          onClick={handleReTranslateExtracted}
                          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>إعادة الترجمة بعد التعديل</span>
                        </button>
                      )}
                    </div>

                    <textarea
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      placeholder="سيظهر النص المقروء من الصورة هنا..."
                      dir="auto"
                      rows={5}
                      className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs leading-relaxed focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>تم استخراج {extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0} كلمة</span>
                  <span>{targetLangObj.name}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Overlay View Mode */
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center">
              <div className="relative max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl bg-black">
                <img
                  src={imagePreview}
                  alt="Overlay Preview"
                  className="w-full h-auto max-h-[600px] object-contain opacity-85"
                />

                {/* Overlaid Translation Glass Card */}
                {translatedText && (
                  <div className="absolute inset-x-4 bottom-4 p-5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/20 text-white shadow-2xl animate-in slide-in-from-bottom-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded-md">
                          الترجمة المدمجة ({targetLangObj.name})
                        </span>
                        {ocrConfidence && (
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">
                            دقة OCR: {ocrConfidence}%
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => speakText(translatedText, targetLang)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                          title="استمع للنطق"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCopy}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                          title="نسخ الترجمة"
                        >
                          {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div
                      dir={targetLangObj.dir || 'auto'}
                      className="text-base font-semibold leading-relaxed"
                    >
                      {translatedText}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl text-white">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Camera className="w-5 h-5 text-blue-500" />
                <span>التقاط صورة للترجمة الفورية</span>
              </div>
              <button
                onClick={closeCamera}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black flex items-center justify-center aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              ></video>
              <div className="absolute inset-8 border-2 border-dashed border-white/50 rounded-2xl pointer-events-none"></div>
            </div>

            <div className="p-4 flex items-center justify-center gap-4 bg-slate-950">
              <button
                onClick={capturePhoto}
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-500/30 transition transform hover:scale-105"
              >
                <Camera className="w-5 h-5" />
                <span>التقاط وترجمة الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Language Modals */}
      <LanguageSelectorModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        selectedCode={sourceLang}
        onSelect={(code) => setSourceLang(code)}
        isSource={true}
        title="اختر لغة الصورة المكتوبة بها"
      />

      <LanguageSelectorModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        selectedCode={targetLang}
        onSelect={(code) => setTargetLang(code)}
        isSource={false}
        title="اختر لغة الترجمة المطلوبة"
      />
    </div>
  );
}
