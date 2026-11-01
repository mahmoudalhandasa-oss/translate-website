import { createWorker } from 'tesseract.js';
import { getLanguageByCode } from '../constants/languages';

/**
 * Preprocess image on a Canvas to improve OCR accuracy
 * @param {HTMLImageElement|File|string} imageSource
 * @param {Object} options - { grayscale: boolean, contrast: number }
 */
export async function preprocessImage(imageSource, options = { grayscale: true, contrast: 1.2 }) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Grayscale and contrast adjustment
      const factor = (259 * (options.contrast * 255 + 255)) / (255 * (259 - options.contrast * 255));

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        if (options.grayscale) {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = gray;
          g = gray;
          b = gray;
        }

        if (options.contrast !== 1) {
          r = factor * (r - 128) + 128;
          g = factor * (g - 128) + 128;
          b = factor * (b - 128) + 128;
        }

        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = (err) => reject(err);

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else if (imageSource instanceof File || imageSource instanceof Blob) {
      img.src = URL.createObjectURL(imageSource);
    }
  });
}

/**
 * Extract text from image using Tesseract.js client-side OCR
 */
export async function extractTextWithTesseract({
  imageSource,
  sourceLang = 'eng',
  onProgress,
}) {
  const langObj = getLanguageByCode(sourceLang);
  // Default to 'eng' or 'ara' or combination
  let ocrLang = langObj.ocrCode || 'eng';
  if (sourceLang === 'auto') {
    // Recognize both Arabic and English by default
    ocrLang = 'ara+eng';
  }

  const worker = await createWorker(ocrLang, 1, {
    logger: (m) => {
      if (onProgress && m.status === 'recognizing text') {
        onProgress({
          status: 'recognizing',
          progress: Math.round((m.progress || 0) * 100),
          message: 'جاري قراءة واستخراج النصوص من الصورة...',
        });
      } else if (onProgress && m.status === 'loading tesseract core') {
        onProgress({
          status: 'loading',
          progress: 20,
          message: 'جاري تهيئة محرك التعرف البصري (OCR)...',
        });
      } else if (onProgress && m.status === 'loading language traineddata') {
        onProgress({
          status: 'loading_lang',
          progress: 50,
          message: `جاري تحميل قاموس لغة التعرف (${ocrLang})...`,
        });
      }
    },
  });

  try {
    const ret = await worker.recognize(imageSource);
    await worker.terminate();
    return {
      text: ret.data.text.trim(),
      confidence: Math.round(ret.data.confidence),
      words: ret.data.words || [],
      lines: ret.data.lines || [],
    };
  } catch (err) {
    await worker.terminate();
    throw err;
  }
}

/**
 * Extract & translate text directly using Gemini Vision API if key available
 */
export async function extractAndTranslateWithGemini({
  imageFile,
  targetLang = 'ar',
  apiKey,
}) {
  if (!apiKey) throw new Error('مفتاح Gemini API غير متوفر');

  // Convert File to base64
  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });

  const mimeType = imageFile.type || 'image/jpeg';
  const targetObj = getLanguageByCode(targetLang);

  const prompt = `You are an advanced optical image translation AI.
1. Transcribe ALL visible text in this image with highest precision (OCR).
2. Detect the language of the text.
3. Translate the transcribed text accurately into ${targetObj.name} (${targetLang}).
4. Keep paragraph breaks intact.

Return ONLY a valid JSON object matching this schema:
{
  "extractedText": "exact text from image",
  "detectedLanguage": "ISO-code",
  "translatedText": "translated text in ${targetObj.name}",
  "notes": "any contextual notes about signs, logos, or format"
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.error?.message || 'فشل التعرف عبر الذكاء الاصطناعي');
  }

  const data = await response.json();
  const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidateText) throw new Error('لم يتم العثور على رد من الذكاء الاصطناعي');

  const parsed = JSON.parse(candidateText);
  return {
    extractedText: parsed.extractedText || '',
    detectedLanguage: parsed.detectedLanguage || 'auto',
    translatedText: parsed.translatedText || '',
    notes: parsed.notes || '',
  };
}
