export interface Lesson {
  id: number
  title: string
  description: string
  duration: string
  videoUrl?: string
  thumbnailUrl: string
  isCompleted?: boolean
  isLocked?: boolean
}

export interface Category {
  id: number
  name: string
  description: string
  icon: string
  color: string
  lessonsCount: number
  thumbnailUrl: string
}

export interface Course {
  id: number
  categoryId: number
  title: string
  description: string
  instructor: string
  thumbnailUrl: string
  lessons: Lesson[]
}
