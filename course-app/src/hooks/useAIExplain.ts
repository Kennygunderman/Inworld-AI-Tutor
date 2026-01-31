import { useState, useRef, useCallback } from 'react'

const API_URL = import.meta.env.VITE_TTS_API_URL || 'http://localhost:3000'

interface AIExplainState {
  isLoading: boolean
  isPlaying: boolean
  error: string | null
  llmLatency: number | null
  ttsLatency: number | null
}

interface UseAIExplainReturn extends AIExplainState {
  explain: (codeLine: string, fullCode: string, variant: 'bad' | 'good' | 'neutral', lineNumber?: number, lessonContext?: string) => Promise<void>
  stop: () => void
}

export function useAIExplain(): UseAIExplainReturn {
  const [state, setState] = useState<AIExplainState>({
    isLoading: false,
    isPlaying: false,
    error: null,
    llmLatency: null,
    ttsLatency: null,
  })
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    if (abortRef.current) {
      abortRef.current.abort()
    }
    setState(prev => ({ ...prev, isPlaying: false, isLoading: false }))
  }, [])

  const explain = useCallback(async (
    codeLine: string, 
    fullCode: string, 
    variant: 'bad' | 'good' | 'neutral',
    lineNumber?: number,
    lessonContext?: string
  ) => {
    // Stop any existing playback
    stop()

    setState({ isLoading: true, isPlaying: false, error: null, llmLatency: null, ttsLatency: null })
    abortRef.current = new AbortController()

    // Build a detailed prompt with full context including the lesson topic
    const variantInstruction = variant === 'bad' 
      ? `This is a BAD CODE EXAMPLE showing anti-patterns. The user clicked on line ${lineNumber || '?'}.
Explain WHY this specific line contributes to the anti-pattern being taught.
Focus on the lesson topic and what makes this problematic. Keep it to 2-3 sentences.`
      : variant === 'good'
      ? `This is a GOOD CODE EXAMPLE showing best practices. The user clicked on line ${lineNumber || '?'}.
Explain WHY this specific line is a good pattern that fixes the anti-pattern.
Focus on the lesson topic and what makes this better. Keep it to 2-3 sentences.`
      : `The user clicked on line ${lineNumber || '?'}. Explain what this line does in context. Keep it to 2-3 sentences.`

    const question = `${lessonContext ? `LESSON BEING TAUGHT:\n${lessonContext}\n\n` : ''}${variantInstruction}

SELECTED LINE (line ${lineNumber || '?'}):
\`${codeLine.trim()}\`

FULL CODE FOR CONTEXT:
\`\`\`tsx
${fullCode}
\`\`\``

    try {
      const response = await fetch(`${API_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question,
          context: 'React/TypeScript code explanation for a coding course'
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      // Get latency from headers
      const llmMs = response.headers.get('X-LLM-Ms')
      const ttfbMs = response.headers.get('X-TTFB-Ms')
      
      setState(prev => ({ 
        ...prev, 
        llmLatency: llmMs ? parseFloat(llmMs) : null,
        ttsLatency: ttfbMs ? parseFloat(ttfbMs) : null,
        isLoading: false,
      }))

      // Get audio blob and play
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      
      if (!audioRef.current) {
        audioRef.current = new Audio()
      }
      
      audioRef.current.src = url
      audioRef.current.onended = () => {
        setState(prev => ({ ...prev, isPlaying: false }))
        URL.revokeObjectURL(url)
      }
      audioRef.current.onerror = () => {
        setState(prev => ({ ...prev, isPlaying: false, error: 'Playback failed' }))
        URL.revokeObjectURL(url)
      }

      await audioRef.current.play()
      setState(prev => ({ ...prev, isPlaying: true }))

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return // Cancelled, not an error
      }
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: err instanceof Error ? err.message : 'Explanation failed' 
      }))
    }
  }, [stop])

  return {
    ...state,
    explain,
    stop,
  }
}
