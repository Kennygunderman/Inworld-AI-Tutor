import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { LessonContent } from './components/LessonContent'
import { course } from './data/course'

function App() {
  const [selectedModuleId, setSelectedModuleId] = useState(course.modules[0].id)
  const [selectedLessonId, setSelectedLessonId] = useState(course.modules[0].lessons[0].id)

  const handleSelectLesson = (moduleId: string, lessonId: string) => {
    setSelectedModuleId(moduleId)
    setSelectedLessonId(lessonId)
  }

  const selectedModule = course.modules.find(m => m.id === selectedModuleId)
  const selectedLesson = selectedModule?.lessons.find(l => l.id === selectedLessonId)

  if (!selectedModule || !selectedLesson) {
    return <div>Lesson not found</div>
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Draggable region for Electron */}
      <div className="absolute top-0 left-0 right-0 h-8 app-region-drag" />
      
      <Sidebar
        course={course}
        selectedLessonId={selectedLessonId}
        onSelectLesson={handleSelectLesson}
      />
      
      <LessonContent
        module={selectedModule}
        lesson={selectedLesson}
      />
    </div>
  )
}

export default App
