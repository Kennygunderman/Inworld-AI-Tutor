import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CodeBlockProps {
  code: string
  language?: string
  showLineNumbers?: boolean
}

export function CodeBlock({ code, language = 'tsx', showLineNumbers = true }: CodeBlockProps) {
  return (
    <div className="code-block rounded-lg overflow-hidden border border-border">
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        showLineNumbers={showLineNumbers}
        customStyle={{
          margin: 0,
          padding: '1.25rem',
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
    </div>
  )
}
