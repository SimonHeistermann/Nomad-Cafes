// Translation service using MyMemory Translation API
// Free tier: 1000 words/day without API key
// https://mymemory.translated.net/doc/spec.php

export type TranslationResult = {
  translatedText: string;
  sourceLanguage?: string;
  targetLanguage: string;
  error?: string;
};

/**
 * Translate text using MyMemory Translation API
 *
 * @param text - Text to translate
 * @param targetLang - Target language code ('en', 'de', etc.)
 * @param sourceLang - Source language code (optional, auto-detect if not provided)
 * @returns Translation result
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang?: string,
): Promise<TranslationResult> {
  try {
    // Auto-detect source language if not provided
    const langPair = sourceLang
      ? `${sourceLang}|${targetLang}`
      : `autodetect|${targetLang}`;

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.responseStatus !== 200) {
      throw new Error(data.responseMessage || 'Translation failed');
    }

    return {
      translatedText: data.responseData.translatedText,
      targetLanguage: targetLang,
      sourceLanguage: sourceLang,
    };
  } catch (error) {
    console.error('Translation error:', error);
    return {
      translatedText: text, // Return original text on error
      targetLanguage: targetLang,
      error: error instanceof Error ? error.message : 'Translation failed',
    };
  }
}

/**
 * Check if a text needs translation based on current language
 *
 * @param currentLang - Current UI language
 * @param textLang - Language of the text (if known)
 * @returns true if translation is needed
 */
export function needsTranslation(
  currentLang: string,
  textLang?: string,
): boolean {
  if (!textLang) return false; // Can't determine, don't translate
  return currentLang !== textLang;
}
