import { Blob } from '@google/genai';

/**
 * Encodes an array of bytes into a Base64 string.
 */
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Creates a Gemini Blob object from raw audio data.
 * @param data The raw audio data (Float32Array).
 * @returns A Blob object ready to be sent to the Gemini API.
 */
export function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Convert Float32 to Int16, as recommended by Gemini documentation.
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}