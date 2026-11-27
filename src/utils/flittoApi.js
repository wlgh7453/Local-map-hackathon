export async function translateTexts(texts, targetLang) {
  if (targetLang === 'ko') {
    return texts;
  }

  try {
    const response = await fetch('/api/flitto/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ texts, targetLang }),
    });

    if (!response.ok) {
      throw new Error(`Flitto API request failed: ${response.status}`);
    }

    const result = await response.json();
    const translatedTexts = result?.data?.contents;

    return Array.isArray(translatedTexts) ? translatedTexts : texts;
  } catch {
    return texts;
  }
}
