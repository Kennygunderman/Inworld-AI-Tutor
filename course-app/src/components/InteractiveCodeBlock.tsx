import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Volume2, Loader2, Zap, X, Brain } from 'lucide-react'
import { Button } from './ui/button'
import { useAIExplain } from '@/hooks/useAIExplain'
import { cn } from '@/lib/utils'

interface InteractiveCodeBlockProps {
  code: string
  language?: string
  variant?: 'bad' | 'good' | 'neutral'
  lessonContext?: string
}

export function InteractiveCodeBlock({ code, language = 'tsx', variant = 'neutral', lessonContext }: InteractiveCodeBlockProps) {
  const [selectedLine, setSelectedLine] = useState<number | null>(null)
  const [hoveredLine, setHoveredLine] = useState<number | null>(null)
  const { explain, stop, isLoading, isPlaying, llmLatency, ttsLatency, error } = useAIExplain()

  const lines = code.trim().split('\n')

  const handleLineClick = async (lineIndex: number) => {
    const line = lines[lineIndex]
    if (!line.trim()) return // Skip empty lines

    setSelectedLine(lineIndex)
    
    // Send the FULL code + lesson context so AI understands what we're teaching
    await explain(line, code, variant, lineIndex + 1, lessonContext)
  }

  const handleClose = () => {
    stop()
    setSelectedLine(null)
  }

  return (
    <div className="relative">
      {/* Selected line explanation panel */}
      {selectedLine !== null && (
        <div className="mb-2 p-3 rounded-lg bg-primary/10 border border-primary/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    <span className="text-xs font-medium text-primary">AI is thinking...</span>
                  </>
                ) : isPlaying ? (
                  <>
                    <Volume2 className="h-4 w-4 text-primary animate-pulse" />
                    <span className="text-xs font-medium text-primary">AI explaining line {selectedLine + 1}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-primary">Line {selectedLine + 1}</span>
                  </>
                )}
                
                {/* Latency badges */}
                {llmLatency && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs">
                    <Brain className="h-3 w-3" />
                    {Math.round(llmLatency)}ms
                  </span>
                )}
                {ttsLatency && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-accent/20 text-accent text-xs">
                    <Zap className="h-3 w-3" />
                    {Math.round(ttsLatency)}ms
                  </span>
                )}
              </div>
              <code className="text-xs text-muted-foreground font-mono">
                {lines[selectedLine].trim()}
              </code>
              {error && (
                <p className="text-xs text-destructive mt-1">{error}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={handleClose}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Code block with clickable lines */}
      <div className="code-block rounded-lg overflow-hidden border border-border">
        <div className="relative">
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            showLineNumbers
            wrapLines
            lineProps={(lineNumber) => {
              const index = lineNumber - 1
              const isSelected = selectedLine === index
              const isHovered = hoveredLine === index
              const isEmpty = !lines[index]?.trim()
              
              return {
                style: {
                  display: 'block',
                  backgroundColor: isSelected 
                    ? 'rgba(139, 92, 246, 0.15)' 
                    : isHovered && !isEmpty
                    ? 'rgba(139, 92, 246, 0.08)'
                    : 'transparent',
                  cursor: isEmpty ? 'default' : 'pointer',
                  borderLeft: isSelected ? '3px solid rgb(139, 92, 246)' : '3px solid transparent',
                  paddingLeft: '0.5rem',
                  transition: 'background-color 0.15s ease',
                },
                onClick: () => !isEmpty && handleLineClick(index),
                onMouseEnter: () => setHoveredLine(index),
                onMouseLeave: () => setHoveredLine(null),
              }
            }}
            customStyle={{
              margin: 0,
              padding: '1rem 0',
              fontSize: '0.875rem',
              lineHeight: '1.7',
              background: '#0d1117',
            }}
            lineNumberStyle={{
              minWidth: '2.5em',
              paddingRight: '1rem',
              color: 'rgba(139, 148, 158, 0.4)',
              userSelect: 'none',
            }}
          >
            {code.trim()}
          </SyntaxHighlighter>

          {/* Click hint */}
          {selectedLine === null && !isPlaying && (
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-secondary/80 text-xs text-muted-foreground flex items-center gap-1">
              <Brain className="h-3 w-3" />
              Click any line for AI explanation
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
