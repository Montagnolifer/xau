import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { ArrowLeft, Play, Lock, CheckCircle, Clock, User } from "lucide-react"
import { courses } from "@/data/courses"
import { notFound } from "next/navigation"

interface LessonPageProps {
  params: {
    id: string
  }
}

export default function LessonPage({ params }: LessonPageProps) {
  const lessonId = Number.parseInt(params.id)

  // Encontrar a aula e o curso correspondente
  let currentLesson = null
  let currentCourse = null
  let lessonIndex = -1

  for (const course of courses) {
    const lesson = course.lessons.find((l) => l.id === lessonId)
    if (lesson) {
      currentLesson = lesson
      currentCourse = course
      lessonIndex = course.lessons.findIndex((l) => l.id === lessonId)
      break
    }
  }

  if (!currentLesson || !currentCourse) {
    notFound()
  }

  const nextLesson = currentCourse.lessons[lessonIndex + 1]
  const prevLesson = currentCourse.lessons[lessonIndex - 1]

  return (
    <div className="min-h-screen py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/aulas/categoria/${currentCourse.categoryId}`}>
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline">Aula {lessonIndex + 1}</Badge>
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                {currentLesson.duration}
              </Badge>
            </div>
            <h1 className="text-xl md:text-2xl font-bold">{currentLesson.title}</h1>
            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
              <User className="h-4 w-4" />
              {currentCourse.instructor}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <div className="relative aspect-video bg-gray-900 rounded-t-lg overflow-hidden">
                <Image
                  src={currentLesson.thumbnailUrl || "/placeholder.svg"}
                  alt={currentLesson.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button size="lg" className="rounded-full w-16 h-16">
                    <Play className="h-8 w-8 ml-1" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4 md:p-6">
                <h2 className="text-lg font-semibold mb-2">{currentLesson.title}</h2>
                <p className="text-gray-600 leading-relaxed">{currentLesson.description}</p>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex gap-4">
              {prevLesson && (
                <Link href={`/aulas/aula/${prevLesson.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Aula Anterior
                  </Button>
                </Link>
              )}
              {nextLesson && (
                <Link href={nextLesson.isLocked ? "#" : `/aulas/aula/${nextLesson.id}`} className="flex-1">
                  <Button className="w-full" disabled={nextLesson.isLocked}>
                    {nextLesson.isLocked ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Bloqueada
                      </>
                    ) : (
                      <>
                        Próxima Aula
                        <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                      </>
                    )}
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Course Lessons List */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-4 md:p-6">
                <h3 className="font-semibold text-lg mb-4">Todas as Aulas</h3>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {currentCourse.lessons.map((lesson, index) => (
                    <Link
                      key={lesson.id}
                      href={lesson.isLocked ? "#" : `/aulas/aula/${lesson.id}`}
                      className={lesson.isLocked ? "pointer-events-none" : ""}
                    >
                      <div
                        className={`
                        flex items-center gap-3 p-3 rounded-lg border transition-colors
                        ${
                          lesson.id === currentLesson.id
                            ? "bg-blue-50 border-blue-200"
                            : lesson.isLocked
                              ? "bg-gray-50 border-gray-200 opacity-60"
                              : "hover:bg-gray-50 border-gray-200 cursor-pointer"
                        }
                      `}
                      >
                        <div className="flex-shrink-0">
                          {lesson.isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : lesson.isLocked ? (
                            <Lock className="h-5 w-5 text-gray-400" />
                          ) : lesson.id === currentLesson.id ? (
                            <Play className="h-5 w-5 text-blue-500" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500">Aula {index + 1}</span>
                            <Badge variant="outline" className="text-xs">
                              {lesson.duration}
                            </Badge>
                            {lesson.id === currentLesson.id && <Badge className="text-xs">Atual</Badge>}
                          </div>
                          <h4 className="font-medium text-sm">{lesson.title}</h4>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
