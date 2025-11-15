
import { GoogleGenAI } from '@google/genai';

const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Identifies the language of a given text.
 * @param text The text to analyze.
 * @returns The identified language name (e.g., "日本語").
 */
export const identifyLanguage = async (text: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Identify the language of the following text. Respond with only the name of the language in that language itself (e.g., "日本語" for Japanese, "English" for English).\n\nText: "${text}"`
    });
    return response.text.trim();
  } catch (error) {
    console.error('Error identifying language:', error);
    return '不明';
  }
};

/**
 * Translates text from a source language to a target language.
 * @param text The text to translate.
 * @param sourceLang The source language name.
 * @param targetLang The target language name.
 * @returns The translated text.
 */
export const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Translate the following text from ${sourceLang} to ${targetLang}:\n\n${text}`
    });
    return response.text.trim();
  } catch (error) {
    console.error('Error translating text:', error);
    return '翻訳に失敗しました';
  }
};
