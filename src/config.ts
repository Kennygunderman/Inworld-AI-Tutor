import 'dotenv/config';

export const config = {
  inworldApiKey: process.env.INWORLD_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  baseUrl: 'https://api.inworld.ai/tts/v1',
  defaults: {
    voiceId: 'default-xnqy6v2hzjmsqzvhp21zvg__kennys_voice',
    modelId: 'inworld-tts-1.5-max',
    sampleRate: 48000,
  },
  outputDir: './out',
  serverPort: parseInt(process.env.PORT || '3000', 10),
} as const;

export function assertApiKey(): string {
  if (!config.inworldApiKey) {
    throw new Error(
      'INWORLD_API_KEY is not set. Please create a .env file with INWORLD_API_KEY=<your-base64-credentials>'
    );
  }
  return config.inworldApiKey;
}
