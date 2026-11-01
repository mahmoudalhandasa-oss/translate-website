/**
 * Generate test sample images on high-resolution canvas with crisp text
 */
export function generateSampleImage(type = 'sign') {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Use 1200x680 for crisp optical recognition
  canvas.width = 1200;
  canvas.height = 680;

  if (type === 'sign') {
    // Street / Airport Notice Sign (English)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 16;
    ctx.strokeStyle = '#f59e0b';
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WELCOME TO INTERNATIONAL AIRPORT', 600, 180);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 44px Arial, sans-serif';
    ctx.fillText('PLEASE HAVE YOUR PASSPORT READY', 600, 310);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '36px Arial, sans-serif';
    ctx.fillText('Baggage drop closes 45 minutes before departure.', 600, 430);
    ctx.fillText('Have a safe and pleasant journey.', 600, 510);
  } else if (type === 'menu') {
    // Restaurant Menu (French)
    ctx.fillStyle = '#fffdfa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 8;
    ctx.strokeStyle = '#78350f';
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    ctx.fillStyle = '#451a03';
    ctx.font = 'bold 52px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('CAFÉ DE PARIS - MENU DU JOUR', 600, 150);

    ctx.textAlign = 'left';
    ctx.font = 'bold 38px Arial, sans-serif';
    ctx.fillText('Croissant au Beurre Frais - 3.50 €', 120, 260);
    ctx.font = 'italic 30px Arial, sans-serif';
    ctx.fillStyle = '#78350f';
    ctx.fillText('Pain artisanal croustillant servi chaud avec du beurre.', 120, 315);

    ctx.fillStyle = '#451a03';
    ctx.font = 'bold 38px Arial, sans-serif';
    ctx.fillText('Café Crème et Salade Gourmande - 8.90 €', 120, 410);
    ctx.font = 'italic 30px Arial, sans-serif';
    ctx.fillStyle = '#78350f';
    ctx.fillText('Café torréfié avec lait moussé et légumes frais bio.', 120, 465);

    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillStyle = '#047857';
    ctx.fillText('Bon Appétit à Tous!', 450, 580);
  } else if (type === 'arabic') {
    // Arabic wisdom / certificate
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 12;
    ctx.strokeStyle = '#fbbf24';
    ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);

    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 56px Arial, Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('حكمة اليوم والنجاح المستمر', 600, 180);

    ctx.fillStyle = '#ffffff';
    ctx.font = '46px Arial, Tahoma, sans-serif';
    ctx.fillText('العلم نور والجهل ظلام', 600, 320);
    ctx.fillText('من سار على الدرب وصل بعزيمة وإصرار', 600, 420);

    ctx.fillStyle = '#fcd34d';
    ctx.font = '36px Arial, Tahoma, sans-serif';
    ctx.fillText('مرحباً بكم في منصة ترجمة النصوص والصور', 600, 530);
  } else {
    // Spanish Technology Quote
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 12;
    ctx.strokeStyle = '#818cf8';
    ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);

    ctx.fillStyle = '#c7d2fe';
    ctx.font = 'bold 52px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TECNOLOGÍA E INNOVACIÓN', 600, 170);

    ctx.fillStyle = '#ffffff';
    ctx.font = '40px Arial, sans-serif';
    ctx.fillText('El futuro pertenece a quienes creen', 600, 300);
    ctx.fillText('en la belleza de sus sueños y proyectos.', 600, 380);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillText('Traducción rápida y automática para todos.', 600, 510);
  }

  return canvas.toDataURL('image/png');
}

export const SAMPLE_PRESETS = [
  {
    id: 'sign',
    title: 'لوحة مطار (إنجليزي)',
    flag: '🇺🇸',
    lang: 'en',
    targetLang: 'ar',
    text: 'WELCOME TO INTERNATIONAL AIRPORT\nPLEASE HAVE YOUR PASSPORT READY\nBaggage drop closes 45 minutes before departure.\nHave a safe and pleasant journey.',
  },
  {
    id: 'menu',
    title: 'قائمة طعام مقهى (فرنسي)',
    flag: '🇫🇷',
    lang: 'fr',
    targetLang: 'ar',
    text: 'CAFÉ DE PARIS - MENU DU JOUR\nCroissant au Beurre Frais - 3.50 €\nPain artisanal croustillant servi chaud avec du beurre.\nCafé Crème et Salade Gourmande - 8.90 €\nCafé torréfié avec lait moussé et légumes frais bio.\nBon Appétit à Tous!',
  },
  {
    id: 'arabic',
    title: 'شهادة وحكمة (عربي)',
    flag: '🇸🇦',
    lang: 'ar',
    targetLang: 'en',
    text: 'حكمة اليوم والنجاح المستمر\nالعلم نور والجهل ظلام\nمن سار على الدرب وصل بعزيمة وإصرار\nمرحباً بكم في منصة ترجمة النصوص والصور',
  },
  {
    id: 'spanish',
    title: 'اقتباس تقني (إسباني)',
    flag: '🇪🇸',
    lang: 'es',
    targetLang: 'ar',
    text: 'TECNOLOGÍA E INNOVACIÓN\nEl futuro pertenece a quienes creen\nen la belleza de sus sueños y proyectos.\nTraducción rápida y automática para todos.',
  },
];
