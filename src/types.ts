// Inworld TTS API Types

export interface TTSRequest {
  text: string;
  voiceId: string;
  modelId: string;
}

export interface TTSStreamRequest extends TTSRequest {
  audio_config: {
    audio_encoding: 'LINEAR16' | 'MP3';
    sample_rate_hertz: number;
  };
}

export interface TTSResponse {
  audioContent: string; // base64 encoded audio
}

export interface TTSStreamChunk {
  result: {
    audioContent: string; // base64 encoded audio chunk
  };
}

export interface StreamStats {
  timeToFirstChunk: number;
  totalTime: number;
}

export interface CLIOptions {
  text: string;
  voice: string;
  model: string;
}
