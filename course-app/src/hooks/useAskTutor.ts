import { useState, useRef, useCallback } from 'react'

const TTS_API_URL = import.meta.env.VITE_TTS_API_URL || 'http://localhost:3000'

interface AskState {
  isLoading: boolean
  isPlaying: boolean
  error: string | null
  llmLatency: number | null
  ttsLatency: number | null
  totalLatency: number | null
  aiResponse: string | null
}

interface UseAskTutorReturn extends AskState {
  ask: (question: string, context?: string) => Promise<void>
  stop: () => void
}

export function useAskTutor(): UseAskTutorReturn {
  const [state, setState] = useState<AskState>({
    isLoading: false,
    isPlaying: false,
    error: null,
    llmLatency: null,
    ttsLatency: null,
    totalLatency: null,
    aiResponse: null,
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

  const ask = useCallback(async (question: string, context?: string) => {
    // Stop any existing playback
    stop()

    setState({ 
      isLoading: true, 
      isPlaying: false, 
      error: null, 
      llmLatency: null,
      ttsLatency: null,
      totalLatency: null,
      aiResponse: null,
    })
    
    abortRef.current = new AbortController()

    try {
      const response = await fetch(`${TTS_API_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error: ${response.status}`)
      }

      // Get latency headers
      const llmMs = response.headers.get('X-LLM-Ms')
      const ttfbMs = response.headers.get('X-TTFB-Ms')
      const totalMs = response.headers.get('X-Total-Ms')
      const aiResponse = response.headers.get('X-AI-Response')
      
      setState(prev => ({ 
        ...prev, 
        llmLatency: llmMs ? parseFloat(llmMs) : null,
        ttsLatency: ttfbMs ? parseFloat(ttfbMs) : null,
        totalLatency: totalMs ? parseFloat(totalMs) : null,
        aiResponse: aiResponse ? decodeURIComponent(aiResponse) : null,
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
        error: err instanceof Error ? err.message : 'Failed to get response' 
      }))
    }
  }, [stop])

  return {
    ...state,
    ask,
    stop,
  }
}
