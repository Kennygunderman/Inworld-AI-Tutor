import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';

/**
 * Decode base64 string to Buffer
 */
export function decodeBase64(base64: string): Buffer {
  return Buffer.from(base64, 'base64');
}

/**
 * Check if buffer starts with WAV header (RIFF....WAVE)
 */
export function hasWavHeader(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  const riff = buffer.toString('ascii', 0, 4);
  const wave = buffer.toString('ascii', 8, 12);
  return riff === 'RIFF' && wave === 'WAVE';
}

/**
 * Strip WAV header (44 bytes) if present
 */
export function stripWavHeader(buffer: Buffer): Buffer {
  if (hasWavHeader(buffer) && buffer.length > 44) {
    return buffer.subarray(44);
  }
  return buffer;
}

/**
 * Create a valid WAV header for raw PCM data
 * LINEAR16 = 16-bit PCM, mono
 */
export function createWavHeader(
  dataLength: number,
  sampleRate: number,
  channels: number = 1,
  bitsPerSample: number = 16
): Buffer {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const fileSize = 36 + dataLength;

  const header = Buffer.alloc(44);

  // RIFF chunk descriptor
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);

  // fmt sub-chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);

  return header;
}

/**
 * Assemble raw PCM chunks into a complete WAV file
 */
export function assembleWav(chunks: Buffer[], sampleRate: number): Buffer {
  const rawData = Buffer.concat(chunks);
  const header = createWavHeader(rawData.length, sampleRate);
  return Buffer.concat([header, rawData]);
}

/**
 * Ensure directory exists and write file
 */
export async function writeAudioFile(filePath: string, data: Buffer): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, data);
}
