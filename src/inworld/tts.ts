import { post, postStream } from './client.js';
import { config } from '../config.js';
import {
  decodeBase64,
  stripWavHeader,
  assembleWav,
  writeAudioFile,
} from '../utils/audio.js';
import type {
  TTSRequest,
  TTSStreamRequest,
  TTSResponse,
  TTSStreamChunk,
  StreamStats,
} from '../types.js';

/**
 * Generate speech audio from text (non-streaming)
 * Returns MP3 audio as Buffer
 */
export async function generateSpeech(
  text: string,
  voiceId: string = config.defaults.voiceId,
  modelId: string = config.defaults.modelId
): Promise<Buffer> {
  const request: TTSRequest = { text, voiceId, modelId };
  const response = await post<TTSResponse>('/voice', request);
  return decodeBase64(response.audioContent);
}

/**
 * Generate speech and save to MP3 file
 */
export async function generateSpeechToFile(
  text: string,
  outputPath: string,
  voiceId: string = config.defaults.voiceId,
  modelId: string = config.defaults.modelId
): Promise<void> {
  const audioBuffer = await generateSpeech(text, voiceId, modelId);
  await writeAudioFile(outputPath, audioBuffer);
}

/**
 * Stream speech audio from text
 * Returns WAV buffer and timing stats
 */
export async function streamSpeech(
  text: string,
  voiceId: string = config.defaults.voiceId,
  modelId: string = config.defaults.modelId,
  sampleRate: number = config.defaults.sampleRate
): Promise<{ audioBuffer: Buffer; stats: StreamStats }> {
  const request: TTSStreamRequest = {
    text,
    voiceId,
    modelId,
    audio_config: {
      audio_encoding: 'LINEAR16',
      sample_rate_hertz: sampleRate,
    },
  };

  const startTime = performance.now();
  let firstChunkTime: number | null = null;
  const chunks: Buffer[] = [];

  const stream = await postStream('/voice:stream', request);
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process line-delimited JSON
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const chunk: TTSStreamChunk = JSON.parse(line);
        if (chunk.result?.audioContent) {
          if (firstChunkTime === null) {
            firstChunkTime = performance.now();
          }

          let audioData = decodeBase64(chunk.result.audioContent);
          // Strip WAV header if present (first chunk often has it)
          audioData = stripWavHeader(audioData);
          chunks.push(audioData);
        }
      } catch (e) {
        console.warn('Failed to parse chunk:', line.substring(0, 100));
      }
    }
  }

  const endTime = performance.now();
  const audioBuffer = assembleWav(chunks, sampleRate);

  return {
    audioBuffer,
    stats: {
      timeToFirstChunk: firstChunkTime ? firstChunkTime - startTime : 0,
      totalTime: endTime - startTime,
    },
  };
}

/**
 * Stream speech and save to WAV file
 */
export async function streamSpeechToFile(
  text: string,
  outputPath: string,
  voiceId: string = config.defaults.voiceId,
  modelId: string = config.defaults.modelId
): Promise<StreamStats> {
  const { audioBuffer, stats } = await streamSpeech(text, voiceId, modelId);
  await writeAudioFile(outputPath, audioBuffer);
  return stats;
}
