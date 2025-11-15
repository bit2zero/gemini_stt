
import { Language } from './types';

export const LANGUAGE_LIMIT = 3;

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'ja-JP', name: '日本語' },
  { code: 'en-US', name: 'English' },
  { code: 'zh-CN', name: '中文 (簡体)' },
  { code: 'ko-KR', name: '한국어' },
  { code: 'es-ES', name: 'Español' },
  { code: 'fr-FR', name: 'Français' },
  { code: 'de-DE', name: 'Deutsch' },
  { code: 'it-IT', name: 'Italiano' },
  { code: 'pt-BR', name: 'Português' },
  { code: 'ru-RU', name: 'Русский' },
  { code: 'hi-IN', name: 'हिन्दी' },
  { code: 'ar-SA', name: 'العربية' },
];
