export interface Lesson {
  id: string
  title: string
  text: string
  voicePrompt: string
  badCode: string
  goodCode: string
  refactorSteps?: string[]
  tests?: string
}

export interface Module {
  id: string
  title: string
  description: string
  lessons: Lesson[]
}

export interface Course {
  title: string
  description: string
  modules: Module[]
}
