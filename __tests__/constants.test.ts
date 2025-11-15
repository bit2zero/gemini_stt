import { describe, it, expect } from 'vitest';
import { LANGUAGE_LIMIT, SUPPORTED_LANGUAGES } from '../constants';
import { Language } from '../types';

describe('constants.ts', () => {
  describe('LANGUAGE_LIMIT', () => {
    it('should be defined as 3', () => {
      expect(LANGUAGE_LIMIT).toBe(3);
    });

    it('should be a number', () => {
      expect(typeof LANGUAGE_LIMIT).toBe('number');
    });
  });

  describe('SUPPORTED_LANGUAGES', () => {
    it('should be an array', () => {
      expect(Array.isArray(SUPPORTED_LANGUAGES)).toBe(true);
    });

    it('should contain 12 languages', () => {
      expect(SUPPORTED_LANGUAGES).toHaveLength(12);
    });

    it('should have valid Language structure for all entries', () => {
      SUPPORTED_LANGUAGES.forEach((lang: Language) => {
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('name');
        expect(typeof lang.code).toBe('string');
        expect(typeof lang.name).toBe('string');
        expect(lang.code.length).toBeGreaterThan(0);
        expect(lang.name.length).toBeGreaterThan(0);
      });
    });

    it('should contain Japanese as first language', () => {
      expect(SUPPORTED_LANGUAGES[0]).toEqual({
        code: 'ja-JP',
        name: '日本語'
      });
    });

    it('should contain English', () => {
      const english = SUPPORTED_LANGUAGES.find(lang => lang.code === 'en-US');
      expect(english).toBeDefined();
      expect(english?.name).toBe('English');
    });

    it('should contain all expected languages', () => {
      const expectedCodes = [
        'ja-JP', 'en-US', 'zh-CN', 'ko-KR',
        'es-ES', 'fr-FR', 'de-DE', 'it-IT',
        'pt-BR', 'ru-RU', 'hi-IN', 'ar-SA'
      ];

      expectedCodes.forEach(code => {
        const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
        expect(lang).toBeDefined();
      });
    });

    it('should have unique language codes', () => {
      const codes = SUPPORTED_LANGUAGES.map(lang => lang.code);
      const uniqueCodes = new Set(codes);
      expect(codes.length).toBe(uniqueCodes.size);
    });

    it('should have unique language names', () => {
      const names = SUPPORTED_LANGUAGES.map(lang => lang.name);
      const uniqueNames = new Set(names);
      expect(names.length).toBe(uniqueNames.size);
    });

    it('should use correct locale format for codes', () => {
      SUPPORTED_LANGUAGES.forEach(lang => {
        // Language codes should follow xx-XX pattern (e.g., ja-JP, en-US)
        expect(lang.code).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
      });
    });
  });
});
