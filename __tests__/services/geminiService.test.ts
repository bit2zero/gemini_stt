import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { identifyLanguage, translateText } from '../../services/geminiService';
import { GoogleGenAI } from '@google/genai';

// Mock @google/genai
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn()
  };
});

describe('geminiService.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variable
    process.env.API_KEY = 'test-api-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('identifyLanguage', () => {
    it('should identify language correctly', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: '日本語'
      });

      const mockGoogleGenAI = {
        models: {
          generateContent: mockGenerateContent
        }
      };

      (GoogleGenAI as any).mockImplementation(() => mockGoogleGenAI);

      const result = await identifyLanguage('こんにちは');

      expect(result).toBe('日本語');
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash',
        contents: expect.stringContaining('Identify the language')
      });
    });

    it('should trim whitespace from result', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: '  English  '
      });

      const mockGoogleGenAI = {
        models: {
          generateContent: mockGenerateContent
        }
      };

      (GoogleGenAI as any).mockImplementation(() => mockGoogleGenAI);

      const result = await identifyLanguage('Hello');

      expect(result).toBe('English');
    });

    it('should return "不明" on error', async () => {
      const mockGenerateContent = vi.fn().mockRejectedValue(new Error('API Error'));

      const mockGoogleGenAI = {
        models: {
          generateContent: mockGenerateContent
        }
      };

      (GoogleGenAI as any).mockImplementation(() => mockGoogleGenAI);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await identifyLanguage('test');

      expect(result).toBe('不明');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle empty text', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: '不明'
      });

      const mockGoogleGenAI = {
        models: {
          generateContent: mockGenerateContent
        }
      };

      (GoogleGenAI as any).mockImplementation(() => mockGoogleGenAI);

      const result = await identifyLanguage('');

      expect(typeof result).toBe('string');
    });
  });

  describe('translateText', () => {
    it('should translate text correctly', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: 'Hello'
      });

      const mockGoogleGenAI = {
        models: {
          generateContent: mockGenerateContent
        }
      };

      (GoogleGenAI as any).mockImplementation(() => mockGoogleGenAI);

      const result = await translateText('こんにちは', '日本語', 'English');

      expect(result).toBe('Hello');
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash',
        contents: expect.stringContaining('Translate the following text from 日本語 to English')
      });
    });

    it('should trim whitespace from translated text', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: '  Bonjour  '
      });

      const mockGoogleGenAI = {
        models: {
          generateContent: mockGenerateContent
        }
      };

      (GoogleGenAI as any).mockImplementation(() => mockGoogleGenAI);

      const result = await translateText('Hello', 'English', 'Français');

      expect(result).toBe('Bonjour');
    });

    it('should return error message on translation failure', async () => {
      const mockGenerateContent = vi.fn().mockRejectedValue(new Error('API Error'));

      const mockGoogleGenAI = {
        models: {
          generateContent: mockGenerateContent
        }
      };

      (GoogleGenAI as any).mockImplementation(() => mockGoogleGenAI);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await translateText('test', 'English', '日本語');

      expect(result).toBe('翻訳に失敗しました');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle empty text translation', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: ''
      });

      const mockGoogleGenAI = {
        models: {
          generateContent: mockGenerateContent
        }
      };

      (GoogleGenAI as any).mockImplementation(() => mockGoogleGenAI);

      const result = await translateText('', 'English', '日本語');

      expect(result).toBe('');
    });

    it('should use correct model and format', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: 'Test translation'
      });

      const mockGoogleGenAI = {
        models: {
          generateContent: mockGenerateContent
        }
      };

      (GoogleGenAI as any).mockImplementation(() => mockGoogleGenAI);

      await translateText('Original', 'English', 'Français');

      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash',
        contents: 'Translate the following text from English to Français:\n\nOriginal'
      });
    });
  });
});
