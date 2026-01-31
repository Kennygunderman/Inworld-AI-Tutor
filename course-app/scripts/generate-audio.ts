/**
 * Pre-generate all lesson audio files using Inworld TTS
 * Run with: npx tsx scripts/generate-audio.ts
 */

import 'dotenv/config'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

const INWORLD_API_KEY = process.env.INWORLD_API_KEY
const VOICE_ID = 'default-xnqy6v2hzjmsqzvhp21zvg__kennys_voice'
const MODEL_ID = 'inworld-tts-1.5-max'

interface Lesson {
  id: string
  title: string
  voicePrompt: string
}

// All lessons from course.ts
const lessons: Lesson[] = [
  {
    id: 'lesson-1-1',
    title: 'The God Component Problem',
    voicePrompt: `A common React anti-pattern is the God Component. This is when a single component handles fetching, state, formatting, event logic, conditional rendering, and UI layout all at once. It works, but it becomes impossible to maintain. The goal is not to write less code. The goal is to put code in the right place so each piece has a single job.`
  },
  {
    id: 'lesson-2-1', 
    title: 'Extracting Custom Hooks',
    voicePrompt: `A custom hook is shared logic with a stable API. When you extract a hook, you are not just moving code. You are creating an interface. The component should read like a story: inputs at the top, hooks next, derived data next, and UI last.`
  },
  {
    id: 'lesson-3-1',
    title: 'Derivations Belong Outside',
    voicePrompt: `If you cannot unit test your logic without rendering a component, that is a smell. React components should orchestrate and render. The logic should live in pure functions. Pure functions are predictable, testable, and reusable.`
  },
  {
    id: 'lesson-4-1',
    title: 'Single Responsibility in Practice',
    voicePrompt: `S R P does not mean tiny files everywhere. It means each unit has one reason to change. In a React app, the most common reasons for change are UI changes, data changes, and business rules changes. When those are tangled together, everything breaks at once.`
  },
  {
    id: 'lesson-5-1',
    title: 'Refactoring Step by Step',
    voicePrompt: `In this module we are going to refactor a real component the way you would on the job. We will not rewrite everything. We will make safe changes in small steps. Extract logic, create hooks, add tests, and only then reorganize files.`
  }
]

async function generateAudio(text: string, lessonId: string): Promise<Buffer> {
  console.log(`  Calling Inworld TTS API...`)
  
  const response = await fetch('https://api.inworld.ai/tts/v1/voice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${INWORLD_API_KEY}`,
    },
    body: JSON.stringify({
      text,
      voiceId: VOICE_ID,
      modelId: MODEL_ID,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`TTS API error ${response.status}: ${error}`)
  }

  const data = await response.json() as { audioContent: string }
  return Buffer.from(data.audioContent, 'base64')
}

async function main() {
  if (!INWORLD_API_KEY) {
    console.error('❌ INWORLD_API_KEY not set in environment')
    process.exit(1)
  }

  const audioDir = join(process.cwd(), 'public', 'audio')
  await mkdir(audioDir, { recursive: true })
  
  console.log('🎙️  Generating audio for all lessons...\n')

  for (const lesson of lessons) {
    console.log(`📝 ${lesson.title} (${lesson.id})`)
    
    try {
      const startTime = performance.now()
      const audioBuffer = await generateAudio(lesson.voicePrompt, lesson.id)
      const duration = performance.now() - startTime
      
      const filePath = join(audioDir, `${lesson.id}.mp3`)
      await writeFile(filePath, audioBuffer)
      
      console.log(`  ✅ Saved to public/audio/${lesson.id}.mp3 (${duration.toFixed(0)}ms)\n`)
    } catch (error) {
      console.error(`  ❌ Failed: ${error}\n`)
    }
  }

  console.log('🎉 Done! Audio files are in public/audio/')
}

main()
