import { getLanguageByCode } from '../constants/languages';

/**
 * Translate text using Google GTX API with MyMemory fallback and optional Gemini AI
 */
export async function translateText({
  text,
  sourceLang = 'auto',
  targetLang = 'ar',
  apiKey = '',
  tone = 'standard', // 'standard', 'formal', 'casual', 'poetic', 'business'
}) {
  if (!text || !text.trim()) {
    return { translatedText: '', detectedLang: null };
  }

  const cleanText = text.trim();

  // 1. If Gemini API Key is provided, use Gemini 1.5 Flash
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const sourceObj = getLanguageByCode(sourceLang);
      const targetObj = getLanguageByCode(targetLang);

      const tonePromptMap = {
        standard: 'accurate and natural',
        formal: 'formal, professional, and courteous (رسمي)',
        casual: 'friendly, modern, and casual (ودي وعفوي)',
        poetic: 'poetic, eloquent, and expressive (أدبي وبليغ)',
        business: 'clear, corporate, and business-focused (أعمال واحترافي)',
      };

      const toneInstruction = tonePromptMap[tone] || 'natural and accurate';

      const prompt = `You are an expert polyglot translator. 
Translate the following text from ${sourceLang === 'auto' ? 'automatically detected language' : sourceObj.name + ` (${sourceLang})`} to ${targetObj.name} (${targetLang}).
Tone requirement: ${toneInstruction}.

Return a valid JSON object matching this schema exactly:
{
  "translatedText": "the direct translation here",
  "detectedLanguage": "ISO-code of source language (e.g. en, ar, fr)",
  "alternatives": ["alternative translation 1", "alternative translation 2"],
  "notes": "brief optional nuance or cultural note"
}

Text to translate:
"""
${cleanText}
"""`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          const parsed = JSON.parse(candidateText);
          return {
            translatedText: parsed.translatedText || '',
            detectedLang: parsed.detectedLanguage || (sourceLang === 'auto' ? 'en' : sourceLang),
            alternatives: parsed.alternatives || [],
            notes: parsed.notes || '',
            engine: 'Gemini AI',
          };
        }
      }
    } catch (err) {
      console.warn('Gemini API translation failed, falling back to public engine:', err);
    }
  }

  // 2. Primary Fast Engine: Google Translate GTX API
  try {
    const sl = sourceLang === 'auto' ? 'auto' : sourceLang;
    const tl = targetLang;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      sl
    )}&tl=${encodeURIComponent(tl)}&dt=t&dt=bd&dt=rm&q=${encodeURIComponent(cleanText)}`;

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const translatedParts = data[0]
        ?.map((part) => part[0])
        .filter(Boolean);
      const translatedText = translatedParts ? translatedParts.join('') : '';
      const detectedLang = data[2] || (sourceLang === 'auto' ? null : sourceLang);

      return {
        translatedText,
        detectedLang,
        alternatives: [],
        engine: 'Google Translate',
      };
    }
  } catch (err) {
    console.warn('Google GTX API failed, trying fallback:', err);
  }

  // 3. Fallback Engine: MyMemory API
  try {
    const sl = sourceLang === 'auto' ? 'en' : sourceLang;
    const tl = targetLang;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      cleanText
    )}&langpair=${encodeURIComponent(sl)}|${encodeURIComponent(tl)}`;

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        return {
          translatedText: data.responseData.translatedText,
          detectedLang: sourceLang === 'auto' ? 'auto' : sourceLang,
          alternatives: data.matches?.slice(1, 3).map((m) => m.translation) || [],
          engine: 'MyMemory',
        };
      }
    }
  } catch (fallbackErr) {
    console.error('All translation providers failed:', fallbackErr);
  }

  throw new Error('تعذر إتمام الترجمة، يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.');
}

/**
 * Stop any ongoing speech playback immediately
 */
export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Text to Speech (TTS) using Web Speech API with callbacks
 */
export function speakText(text, langCode = 'ar', callbacks = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser');
    return false;
  }

  // Stop any currently playing audio first
  window.speechSynthesis.cancel();

  if (!text || !text.trim()) return false;

  const utterance = new SpeechSynthesisUtterance(text);
  const langObj = getLanguageByCode(langCode);
  utterance.lang = langObj.speechCode || 'en-US';

  // Find best matched voice
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(
    (v) => v.lang.toLowerCase().startsWith(utterance.lang.toLowerCase().split('-')[0])
  );
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  if (callbacks.onStart) utterance.onstart = callbacks.onStart;
  if (callbacks.onEnd) utterance.onend = callbacks.onEnd;
  if (callbacks.onError) utterance.onerror = callbacks.onError;

  window.speechSynthesis.speak(utterance);
  return true;
}

/**
 * Speech to Text (Microphone) helper using Web Speech API
 */
export function createSpeechRecognizer(langCode = 'ar-SA', onResult, onError, onEnd) {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = langCode;

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    if (onResult) onResult(transcript, event.results[event.results.length - 1].isFinal);
  };

  recognition.onerror = (event) => {
    if (onError) onError(event.error);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
}
