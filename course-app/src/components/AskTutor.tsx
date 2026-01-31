import { useState, FormEvent, useEffect, useRef } from 'react'
import { Send, Loader2, Square, MessageCircle, Zap, Brain, Mic, StopCircle, Volume2 } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

const TTS_API_URL = import.meta.env.VITE_TTS_API_URL || 'http://localhost:3000'

// Browser Speech Recognition types
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

const SpeechRecognition = typeof window !== 'undefined' 
  ? (window.SpeechRecognition || window.webkitSpeechRecognition) 
  : null

interface AskTutorProps {
  lessonContext: string
  codeContext?: string
}

export function AskTutor({ lessonContext, codeContext }: AskTutorProps) {
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [responseText, setResponseText] = useState<string | null>(null)
  const [llmLatency, setLlmLatency] = useState<number | null>(null)
  const [ttsLatency, setTtsLatency] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const browserSupportsSpeechRecognition = !!SpeechRecognition

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [])

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    if (abortRef.current) {
      abortRef.current.abort()
    }
    setIsPlaying(false)
    setIsLoading(false)
  }

  const askQuestion = async (text: string) => {
    if (!text.trim()) return

    stopAudio()
    setIsLoading(true)
    setError(null)
    setLlmLatency(null)
    setTtsLatency(null)
    setResponseText(null)

    abortRef.current = new AbortController()

    try {
      const context = `${lessonContext}\n\nCode being discussed:\n${codeContext || 'No specific code selected'}`

      const response = await fetch(`${TTS_API_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, context }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Request failed: ${response.status}`)
      }

      // Get latency from headers
      const llmMs = response.headers.get('X-LLM-Ms')
      const ttfbMs = response.headers.get('X-TTFB-Ms')
      const aiResponse = decodeURIComponent(response.headers.get('X-AI-Response') || '')

      setLlmLatency(llmMs ? parseFloat(llmMs) : null)
      setTtsLatency(ttfbMs ? parseFloat(ttfbMs) : null)
      setResponseText(aiResponse)
      setIsLoading(false)

      // Play audio
      const audioBlob = await response.blob()
      const url = URL.createObjectURL(audioBlob)

      if (!audioRef.current) {
        audioRef.current = new Audio()
      }
      audioRef.current.src = url
      audioRef.current.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(url)
      }
      audioRef.current.onerror = () => {
        setIsPlaying(false)
        setError('Audio playback failed')
        URL.revokeObjectURL(url)
      }

      await audioRef.current.play()
      setIsPlaying(true)

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      setIsLoading(false)
      setError(err instanceof Error ? err.message : 'Failed to get response')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!question.trim() || isLoading) return
    await askQuestion(question)
    setQuestion('')
  }

  const startListening = () => {
    if (!SpeechRecognition) return

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = false
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang = 'en-US'

    recognitionRef.current.onstart = () => {
      setIsListening(true)
      setQuestion('')
      setError(null)
    }

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setQuestion(transcript)
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)
      // Auto-submit when done listening
      if (question.trim()) {
        askQuestion(question)
        setQuestion('')
      }
    }

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false)
      if (event.error !== 'no-speech') {
        setError(`Speech recognition error: ${event.error}`)
      }
    }

    recognitionRef.current.start()
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const handleMicClick = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className="border border-border rounded-lg bg-card/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">Ask the Tutor</h3>
        <span className="text-xs text-muted-foreground">(AI + Inworld TTS)</span>
        
        <div className="ml-auto flex items-center gap-3">
          {llmLatency && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Brain className="h-3 w-3" />
              <span>{Math.round(llmLatency)}ms</span>
            </div>
          )}
          {ttsLatency && (
            <div className="flex items-center gap-1 text-xs text-accent">
              <Zap className="h-3 w-3" />
              <span>{Math.round(ttsLatency)}ms</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        {browserSupportsSpeechRecognition && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleMicClick}
            className={cn(
              "shrink-0",
              isListening && "bg-destructive/20 text-destructive animate-pulse"
            )}
            disabled={isLoading || isPlaying}
          >
            {isListening ? <StopCircle className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={isListening ? "Listening..." : "Ask a question about this lesson..."}
          className={cn(
            "flex-1 px-3 py-2 text-sm rounded-md",
            "bg-secondary border border-border",
            "text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/50"
          )}
          disabled={isLoading || isPlaying || isListening}
        />
        
        {isPlaying ? (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={stopAudio}
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            variant="default"
            size="icon"
            disabled={!question.trim() || isLoading || isListening}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        )}
      </form>

      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}

      {responseText && (
        <div className="mt-3 p-3 rounded-md bg-secondary text-sm text-foreground/90">
          {responseText}
        </div>
      )}

      {isPlaying && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-1 h-4 bg-primary rounded-full animate-pulse" />
            <span className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '75ms' }} />
            <span className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
          </div>
          <Volume2 className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">Tutor is speaking with Inworld TTS...</span>
        </div>
      )}

      {isListening && (
        <div className="mt-3 flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/30">
          <div className="flex gap-1">
            <span className="w-2 h-4 bg-red-500 rounded-full animate-pulse" />
            <span className="w-2 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '75ms' }} />
            <span className="w-2 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
          </div>
          <span className="text-xs text-red-400">Listening... speak your question</span>
        </div>
      )}
    </div>
  )
}
