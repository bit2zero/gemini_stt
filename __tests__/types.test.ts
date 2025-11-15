import { describe, it, expect } from 'vitest';
import type { Language, Transcription } from '../types';

describe('types.ts', () => {
  describe('Language interface', () => {
    it('should accept valid Language object', () => {
      const language: Language = {
        code: 'ja-JP',
        name: '日本語'
      };

      expect(language.code).toBe('ja-JP');
      expect(language.name).toBe('日本語');
    });

    it('should have required properties', () => {
      const language: Language = {
        code: 'en-US',
        name: 'English'
      };

      expect(language).toHaveProperty('code');
      expect(language).toHaveProperty('name');
    });
  });

  describe('Transcription interface', () => {
    it('should accept valid Transcription with required fields only', () => {
      const transcription: Transcription = {
        originalText: 'こんにちは',
        sourceLang: '日本語',
        timestamp: new Date().toISOString()
      };

      expect(transcription.originalText).toBe('こんにちは');
      expect(transcription.sourceLang).toBe('日本語');
      expect(transcription.timestamp).toBeDefined();
    });

    it('should accept Transcription with all fields', () => {
      const transcription: Transcription = {
        originalText: 'こんにちは',
        sourceLang: '日本語',
        translatedText: 'Hello',
        targetLang: 'English',
        timestamp: new Date().toISOString()
      };

      expect(transcription.originalText).toBe('こんにちは');
      expect(transcription.sourceLang).toBe('日本語');
      expect(transcription.translatedText).toBe('Hello');
      expect(transcription.targetLang).toBe('English');
      expect(transcription.timestamp).toBeDefined();
    });

    it('should accept Transcription without translation fields', () => {
      const transcription: Transcription = {
        originalText: 'Test',
        sourceLang: 'English',
        timestamp: '2025-01-01T00:00:00.000Z'
      };

      expect(transcription.translatedText).toBeUndefined();
      expect(transcription.targetLang).toBeUndefined();
    });

    it('should have valid ISO 8601 timestamp format', () => {
      const timestamp = new Date().toISOString();
      const transcription: Transcription = {
        originalText: 'Test',
        sourceLang: 'English',
        timestamp
      };

      // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(transcription.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should accept partial translation (translatedText without targetLang)', () => {
      const transcription: Transcription = {
        originalText: 'Test',
        sourceLang: 'English',
        translatedText: 'テスト',
        timestamp: new Date().toISOString()
      };

      expect(transcription.translatedText).toBe('テスト');
      expect(transcription.targetLang).toBeUndefined();
    });

    it('should accept partial translation (targetLang without translatedText)', () => {
      const transcription: Transcription = {
        originalText: 'Test',
        sourceLang: 'English',
        targetLang: '日本語',
        timestamp: new Date().toISOString()
      };

      expect(transcription.targetLang).toBe('日本語');
      expect(transcription.translatedText).toBeUndefined();
    });
  });

  describe('Type compatibility', () => {
    it('should allow Language in array', () => {
      const languages: Language[] = [
        { code: 'ja-JP', name: '日本語' },
        { code: 'en-US', name: 'English' }
      ];

      expect(languages).toHaveLength(2);
      expect(languages[0].code).toBe('ja-JP');
    });

    it('should allow Transcription in array', () => {
      const transcriptions: Transcription[] = [
        {
          originalText: 'Hello',
          sourceLang: 'English',
          timestamp: new Date().toISOString()
        },
        {
          originalText: 'こんにちは',
          sourceLang: '日本語',
          translatedText: 'Hello',
          targetLang: 'English',
          timestamp: new Date().toISOString()
        }
      ];

      expect(transcriptions).toHaveLength(2);
      expect(transcriptions[1].translatedText).toBe('Hello');
    });
  });
});
