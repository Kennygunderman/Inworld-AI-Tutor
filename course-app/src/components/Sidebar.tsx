import { BookOpen, ChevronRight } from 'lucide-react'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { cn } from '@/lib/utils'
import { Course, Module, Lesson } from '@/types'

interface SidebarProps {
  course: Course
  selectedLessonId: string
  onSelectLesson: (moduleId: string, lessonId: string) => void
}

export function Sidebar({ course, selectedLessonId, onSelectLesson }: SidebarProps) {
  return (
    <div className="w-72 border-r border-border bg-card/50 flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">{course.title}</h1>
            <p className="text-xs text-muted-foreground">{course.modules.length} modules</p>
          </div>
        </div>
      </div>

      {/* Module List */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {course.modules.map((module, moduleIndex) => (
            <ModuleItem
              key={module.id}
              module={module}
              moduleIndex={moduleIndex}
              selectedLessonId={selectedLessonId}
              onSelectLesson={(lessonId) => onSelectLesson(module.id, lessonId)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Built with Inworld TTS
        </p>
      </div>
    </div>
  )
}

interface ModuleItemProps {
  module: Module
  moduleIndex: number
  selectedLessonId: string
  onSelectLesson: (lessonId: string) => void
}

function ModuleItem({ module, moduleIndex, selectedLessonId, onSelectLesson }: ModuleItemProps) {
  const hasSelectedLesson = module.lessons.some(l => l.id === selectedLessonId)

  return (
    <div className="mb-4">
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md mb-1",
        hasSelectedLesson ? "bg-primary/10" : "bg-transparent"
      )}>
        <span className={cn(
          "flex items-center justify-center h-6 w-6 rounded-md text-xs font-medium",
          hasSelectedLesson 
            ? "bg-primary text-primary-foreground" 
            : "bg-secondary text-muted-foreground"
        )}>
          {moduleIndex + 1}
        </span>
        <span className={cn(
          "text-sm font-medium truncate",
          hasSelectedLesson ? "text-foreground" : "text-muted-foreground"
        )}>
          {module.title}
        </span>
      </div>

      <div className="ml-4 border-l border-border pl-3 space-y-1">
        {module.lessons.map((lesson) => (
          <LessonItem
            key={lesson.id}
            lesson={lesson}
            isSelected={lesson.id === selectedLessonId}
            onClick={() => onSelectLesson(lesson.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface LessonItemProps {
  lesson: Lesson
  isSelected: boolean
  onClick: () => void
}

function LessonItem({ lesson, isSelected, onClick }: LessonItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors",
        isSelected 
          ? "bg-secondary text-foreground" 
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
      )}
    >
      <ChevronRight className={cn(
        "h-3 w-3 shrink-0 transition-transform",
        isSelected && "text-accent"
      )} />
      <span className="text-sm truncate">{lesson.title}</span>
    </button>
  )
}
