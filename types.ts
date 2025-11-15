
export interface Language {
  code: string;
  name: string;
}

export interface Transcription {
  originalText: string;
  sourceLang: string;
  translatedText?: string;
  targetLang?: string;
  timestamp: string;
}
