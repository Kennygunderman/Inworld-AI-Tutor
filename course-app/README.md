# React Patterns Course

A simple Vite web app for learning React patterns with AI-powered audio lessons.

## Features

- 📚 5 modules on React architecture
- 🎧 Pre-generated audio lessons using Inworld TTS
- 💻 Side-by-side bad vs good code examples
- ✅ Step-by-step refactoring checklists
- 🧪 Unit test examples
- 🎨 Modern dark UI with Tailwind + shadcn

## Setup

### 1. Install dependencies

```bash
cd course-app
npm install
```

### 2. Generate audio (requires Inworld API key)

Create a `.env` file:

```bash
INWORLD_API_KEY=your_base64_encoded_api_key_here
```

Then generate audio for all lessons:

```bash
npm run generate-audio
```

### 3. Run the app

```bash
npm run dev
```

Open http://localhost:5173

## Project Structure

```
course-app/
├── public/
│   └── audio/           # Pre-generated MP3 files
├── scripts/
│   └── generate-audio.ts
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn-style components
│   │   ├── AudioPlayer.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── LessonContent.tsx
│   │   └── Sidebar.tsx
│   ├── data/
│   │   └── course.ts    # Course content
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── vite.config.ts
```

## Course Modules

1. **Component Hygiene** - Stop dumping everything in one component
2. **Hooks Done Right** - Stop misusing hooks or shoving everything into effects
3. **Pure Functions** - Move business logic out of React for testability
4. **SRP & Separation** - One reason to change in React land
5. **Refactor Capstone** - End-to-end refactor of a real component

## Customization

### Change the voice

Edit `scripts/generate-audio.ts`:

```ts
const VOICE_ID = 'your-voice-id'
const MODEL_ID = 'inworld-tts-1.5-max'
```

Then regenerate: `npm run generate-audio`

### Add new lessons

1. Edit `src/data/course.ts`
2. Add the lesson to `scripts/generate-audio.ts`
3. Run `npm run generate-audio`

## Build for Production

```bash
npm run build
npm run preview
```

## Tech Stack

- **Vite** - Fast bundler
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible primitives
- **Inworld TTS** - AI voice synthesis

## License

MIT
