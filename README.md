# Inworld TTS

Minimal Node.js + TypeScript CLI and server for Inworld Text-to-Speech API.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with your Inworld API key:

```bash
cp .env.example .env
# Edit .env and add your INWORLD_API_KEY
```

Your `INWORLD_API_KEY` should be the Base64-encoded credentials from your Inworld dashboard.

## CLI Usage

### Generate MP3 (non-streaming)

```bash
npm run tts -- --text "Hello, world!"

# With custom voice and model
npm run tts -- --text "Hello, world!" --voice Ashley --model inworld-tts-1.5-max
```

Output: `./out/output.mp3`

### Stream Audio (save as WAV)

```bash
npm run tts:stream -- --text "Hello, world!"

# With custom voice
npm run tts:stream -- --text "Hello, world!" --voice Ashley
```

Output: `./out/output_stream.wav`

Prints latency stats:
- Time to first chunk
- Total request time

## Server Usage

### Start the server

```bash
# Development (with hot reload)
npm run dev

# Or directly
npm run server

# Production
npm run build
npm start
```

### API Endpoints

#### `POST /api/tts` - Generate MP3

```bash
curl -X POST http://localhost:3000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, world!"}' \
  --output output.mp3
```

With options:
```bash
curl -X POST http://localhost:3000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello!", "voice": "Ashley", "model": "inworld-tts-1.5-max"}' \
  --output output.mp3
```

#### `POST /api/tts/stream` - Generate WAV (streaming)

```bash
curl -X POST http://localhost:3000/api/tts/stream \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, world!"}' \
  --output output.wav
```

Response headers include timing stats:
- `X-TTFB-Ms`: Time to first byte
- `X-Total-Ms`: Total processing time

#### `GET /health` - Health check

```bash
curl http://localhost:3000/health
```

## Project Structure

```
src/
├── cli.ts              # CLI command parsing
├── config.ts           # Configuration and env loading
├── server.ts           # Express server
├── types.ts            # TypeScript interfaces
├── inworld/
│   ├── client.ts       # HTTP helpers, auth headers
│   └── tts.ts          # TTS voice + stream functions
└── utils/
    └── audio.ts        # Base64 decode, WAV assembly
```

## Configuration

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `INWORLD_API_KEY` | Base64-encoded API credentials | Required |
| `PORT` | Server port | `3000` |

## Defaults

- Voice: `Ashley`
- Model: `inworld-tts-1.5-max`
- Sample Rate: `48000` Hz (for streaming)

## License

MIT
