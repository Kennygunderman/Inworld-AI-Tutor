import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Square, Volume2, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

interface AudioPlayerProps {
  lessonId: string
  voicePrompt: string
}

export function AudioPlayer({ lessonId }: AudioPlayerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasAudio, setHasAudio] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const audioUrl = `/audio/${lessonId}.mp3`

  // Check if audio file exists on mount
  useEffect(() => {
    const checkAudio = async () => {
      try {
        const response = await fetch(audioUrl, { method: 'HEAD' })
        setHasAudio(response.ok)
      } catch {
        setHasAudio(false)
      }
    }
    checkAudio()
  }, [audioUrl])

  const handlePlay = async () => {
    if (!hasAudio) {
      setError('Audio not generated yet. Run: npx tsx scripts/generate-audio.ts')
      return
    }

    if (audioRef.current) {
      setIsLoading(true)
      setError(null)
      
      try {
        audioRef.current.src = audioUrl
        audioRef.current.playbackRate = playbackRate
        await audioRef.current.play()
        setIsPlaying(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to play audio')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handlePause = () => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
  }

  const handleSpeedChange = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2]
    const currentIndex = speeds.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % speeds.length
    const newRate = speeds[nextIndex]
    setPlaybackRate(newRate)
    
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
  }

  return (
    <div className="flex items-center gap-3">
      <audio ref={audioRef} onEnded={handleEnded} />
      
      <div className="flex items-center gap-1">
        {isPlaying ? (
          <Button
            variant="outline"
            size="icon"
            onClick={handlePause}
            className="h-9 w-9"
          >
            <Pause className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="default"
            size="icon"
            onClick={handlePlay}
            disabled={isLoading}
            className={cn("h-9 w-9", hasAudio && "animate-pulse-glow")}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        )}
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleStop}
          disabled={!isPlaying}
          className="h-9 w-9"
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleSpeedChange}
        className="text-xs font-mono min-w-[4rem]"
      >
        {playbackRate}x
      </Button>

      {hasAudio && (
        <Volume2 className="h-4 w-4 text-accent" />
      )}

      {!hasAudio && !error && (
        <span className="text-xs text-muted-foreground">Audio not generated</span>
      )}

      {error && (
        <span className="text-sm text-destructive">{error}</span>
      )}
    </div>
  )
}
