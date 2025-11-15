import { describe, it, expect } from 'vitest';
import { encode, createBlob } from '../../utils/audio';

describe('audio.ts', () => {
  describe('encode', () => {
    it('should encode Uint8Array to Base64 string', () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const result = encode(bytes);
      expect(result).toBe('SGVsbG8=');
    });

    it('should handle empty array', () => {
      const bytes = new Uint8Array([]);
      const result = encode(bytes);
      expect(result).toBe('');
    });

    it('should handle single byte', () => {
      const bytes = new Uint8Array([65]); // "A"
      const result = encode(bytes);
      expect(result).toBe('QQ==');
    });

    it('should handle longer arrays', () => {
      const bytes = new Uint8Array([84, 104, 101, 32, 113, 117, 105, 99, 107, 32, 98, 114, 111, 119, 110]);
      const result = encode(bytes);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('createBlob', () => {
    it('should create a Blob with correct mimeType', () => {
      const data = new Float32Array([0.5, -0.5, 0.25, -0.25]);
      const blob = createBlob(data);

      expect(blob).toHaveProperty('data');
      expect(blob).toHaveProperty('mimeType');
      expect(blob.mimeType).toBe('audio/pcm;rate=16000');
    });

    it('should convert Float32Array to base64 encoded data', () => {
      const data = new Float32Array([0.5, -0.5, 0.25, -0.25]);
      const blob = createBlob(data);

      expect(typeof blob.data).toBe('string');
      expect(blob.data.length).toBeGreaterThan(0);
    });

    it('should handle empty Float32Array', () => {
      const data = new Float32Array([]);
      const blob = createBlob(data);

      expect(blob.data).toBe('');
      expect(blob.mimeType).toBe('audio/pcm;rate=16000');
    });

    it('should properly scale Float32 values to Int16', () => {
      // 1.0 should map to 32768
      const data = new Float32Array([1.0]);
      const blob = createBlob(data);

      // Decode the result to verify scaling
      const decoded = atob(blob.data);
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }
      const int16View = new Int16Array(bytes.buffer);

      expect(int16View[0]).toBe(32768);
    });

    it('should handle negative values correctly', () => {
      const data = new Float32Array([-1.0]);
      const blob = createBlob(data);

      // Decode to verify
      const decoded = atob(blob.data);
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }
      const int16View = new Int16Array(bytes.buffer);

      expect(int16View[0]).toBe(-32768);
    });

    it('should handle typical audio buffer size (4096 samples)', () => {
      const data = new Float32Array(4096);
      for (let i = 0; i < 4096; i++) {
        data[i] = Math.sin(i / 10) * 0.5; // Simulate audio data
      }

      const blob = createBlob(data);

      expect(blob.data).toBeDefined();
      expect(blob.data.length).toBeGreaterThan(0);
      expect(blob.mimeType).toBe('audio/pcm;rate=16000');
    });
  });
});
