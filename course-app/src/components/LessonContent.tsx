import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { InteractiveCodeBlock } from './InteractiveCodeBlock'
import { AskTutor } from './AskTutor'
import { Lesson, Module } from '@/types'
import { FileCode2, FileX2, ListChecks, TestTube2 } from 'lucide-react'

interface LessonContentProps {
  module: Module
  lesson: Lesson
}

export function LessonContent({ module, lesson }: LessonContentProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border bg-card/30">
        <p className="text-sm text-accent font-medium mb-1">{module.title}</p>
        <h1 className="text-2xl font-bold text-foreground mb-2">{lesson.title}</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">{module.description}</p>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-8 space-y-6">
          {/* Ask the Tutor */}
          <AskTutor 
            lessonContext={lesson.text} 
            codeContext={lesson.badCode}
          />

          <Tabs defaultValue="lesson" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="lesson" className="gap-2">
                <FileCode2 className="h-4 w-4" />
                Lesson
              </TabsTrigger>
              <TabsTrigger value="bad" className="gap-2">
                <FileX2 className="h-4 w-4" />
                Bad Example
              </TabsTrigger>
              {lesson.refactorSteps && (
                <TabsTrigger value="steps" className="gap-2">
                  <ListChecks className="h-4 w-4" />
                  Refactor Steps
                </TabsTrigger>
              )}
              <TabsTrigger value="good" className="gap-2">
                <FileCode2 className="h-4 w-4" />
                Good Example
              </TabsTrigger>
              {lesson.tests && (
                <TabsTrigger value="tests" className="gap-2">
                  <TestTube2 className="h-4 w-4" />
                  Tests
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="lesson">
              <Card>
                <CardHeader>
                  <CardTitle>The Concept</CardTitle>
                  <CardDescription>Understanding the pattern</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    {lesson.text.split('\n\n').map((paragraph, i) => (
                      <p key={i} className="text-foreground/90 leading-relaxed mb-4">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bad">
              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">❌ Don't Do This</CardTitle>
                  <CardDescription>Click any line to hear why it's problematic</CardDescription>
                </CardHeader>
                <CardContent>
                  <InteractiveCodeBlock 
                    code={lesson.badCode} 
                    variant="bad" 
                    lessonContext={`Lesson: ${lesson.title}\n\n${lesson.text}`}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {lesson.refactorSteps && (
              <TabsContent value="steps">
                <Card>
                  <CardHeader>
                    <CardTitle>Refactor Checklist</CardTitle>
                    <CardDescription>Follow these steps to improve the code</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {lesson.refactorSteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-accent text-accent-foreground text-xs font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-foreground/90">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="good">
              <Card>
                <CardHeader>
                  <CardTitle className="text-accent">✓ Do This Instead</CardTitle>
                  <CardDescription>Click any line to hear why it's better</CardDescription>
                </CardHeader>
                <CardContent>
                  <InteractiveCodeBlock 
                    code={lesson.goodCode} 
                    variant="good" 
                    lessonContext={`Lesson: ${lesson.title}\n\n${lesson.text}`}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {lesson.tests && (
              <TabsContent value="tests">
                <Card>
                  <CardHeader>
                    <CardTitle>Unit Tests</CardTitle>
                    <CardDescription>Click any line to hear an explanation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <InteractiveCodeBlock code={lesson.tests} />
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  )
}
