import express, { Request, Response, NextFunction } from 'express';
import OpenAI from 'openai';
import { config } from './config.js';
import { generateSpeech, streamSpeech } from './inworld/tts.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

const app = express();
app.use(express.json());

// CORS middleware for browser access
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'X-TTFB-Ms, X-Total-Ms, X-LLM-Ms, X-AI-Response');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Request body types
interface TTSRequestBody {
  text: string;
  voice?: string;
  model?: string;
}

// Error handler middleware
function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Server error:', err.message);
  res.status(500).json({ error: err.message });
}

/**
 * POST /api/tts
 * Generate MP3 audio from text
 */
app.post('/api/tts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, voice, model } = req.body as TTSRequestBody;

    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }

    console.log(`[TTS] Generating: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

    const audioBuffer = await generateSpeech(
      text,
      voice || config.defaults.voiceId,
      model || config.defaults.modelId
    );

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="output.mp3"');
    res.send(audioBuffer);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tts/stream
 * Stream and return WAV audio from text
 */
app.post('/api/tts/stream', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, voice, model } = req.body as TTSRequestBody;

    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }

    console.log(`[TTS Stream] Generating: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

    const { audioBuffer, stats } = await streamSpeech(
      text,
      voice || config.defaults.voiceId,
      model || config.defaults.modelId
    );

    console.log(`[TTS Stream] TTFB: ${stats.timeToFirstChunk.toFixed(0)}ms, Total: ${stats.totalTime.toFixed(0)}ms`);

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', 'attachment; filename="output.wav"');
    res.setHeader('X-TTFB-Ms', stats.timeToFirstChunk.toFixed(0));
    res.setHeader('X-Total-Ms', stats.totalTime.toFixed(0));
    res.send(audioBuffer);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ask
 * Ask a question, get AI-generated response as audio
 */
interface AskRequestBody {
  question: string;
  context?: string;
}

app.post('/api/ask', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question, context } = req.body as AskRequestBody;

    if (!question) {
      res.status(400).json({ error: 'question is required' });
      return;
    }

    if (!config.openaiApiKey) {
      res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
      return;
    }

    console.log(`[Ask] Question: "${question.substring(0, 50)}${question.length > 50 ? '...' : ''}"`);

    const startTime = performance.now();

    // Generate response with OpenAI
    const systemPrompt = `You are a helpful coding tutor specializing in React and TypeScript. 
Give concise, clear answers in 2-3 sentences. Be friendly and encouraging.
${context ? `\nContext about the current lesson:\n${context}` : ''}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      max_tokens: 150,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I could not generate a response.';
    const llmTime = performance.now() - startTime;

    console.log(`[Ask] LLM response (${llmTime.toFixed(0)}ms): "${aiResponse.substring(0, 50)}..."`);

    // Convert to speech with Inworld TTS
    const ttsStartTime = performance.now();
    const { audioBuffer, stats } = await streamSpeech(
      aiResponse,
      config.defaults.voiceId,
      config.defaults.modelId
    );
    const ttsTime = performance.now() - ttsStartTime;

    console.log(`[Ask] TTS done. LLM: ${llmTime.toFixed(0)}ms, TTS TTFB: ${stats.timeToFirstChunk.toFixed(0)}ms, TTS Total: ${ttsTime.toFixed(0)}ms`);

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('X-LLM-Ms', llmTime.toFixed(0));
    res.setHeader('X-TTFB-Ms', stats.timeToFirstChunk.toFixed(0));
    res.setHeader('X-Total-Ms', (performance.now() - startTime).toFixed(0));
    res.setHeader('X-AI-Response', encodeURIComponent(aiResponse));
    res.send(audioBuffer);
  } catch (error) {
    next(error);
  }
});

/**
 * Health check
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

const port = config.serverPort;
app.listen(port, () => {
  console.log(`🚀 Inworld TTS server running on http://localhost:${port}`);
  console.log('\nEndpoints:');
  console.log(`  POST /api/tts          - Generate MP3`);
  console.log(`  POST /api/tts/stream   - Generate WAV (streaming)`);
  console.log(`  POST /api/ask          - Ask AI tutor (LLM + TTS)`);
  console.log(`  GET  /health           - Health check`);
});
