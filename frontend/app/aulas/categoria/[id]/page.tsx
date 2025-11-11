import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ArrowLeft, Play, Lock, CheckCircle, Clock, Star, Users, Crown, Award, TrendingUp } from "lucide-react"
import { categories, courses } from "@/data/courses"
import { notFound } from "next/navigation"

interface CategoryPageProps {
  params: {
    id: string
  }
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const categoryId = Number.parseInt(params.id)
  const category = categories.find((c) => c.id === categoryId)
  const categoryCourses = courses.filter((c) => c.categoryId === categoryId)

  if (!category) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-brand-background">
      {/* Hero Section */}
      <div className="relative h-[60vh] overflow-hidden bg-gradient-to-r from-brand-secondary via-brand-secondary to-brand-primary">
        <Image
          src={category.thumbnailUrl || "/placeholder.svg"}
          alt={category.name}
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        <div className="absolute top-6 left-6">
          <Link href="/aulas">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 border-2 border-white/30">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="h-10 w-10 text-brand-primary" />
              <span className="text-4xl md:text-5xl">{category.icon}</span>
              <Badge className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white border-0 px-4 py-2 font-bold">
                {category.lessonsCount} AULAS
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              {category.name}
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-6 max-w-2xl">{category.description}</p>
            <div className="flex items-center gap-6 text-sm text-white/80 mb-6">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-brand-primary" />
                <span>Avaliação 4.9</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>2.5k alunos</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>3h 45min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div className="px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Award className="h-8 w-8 text-brand-primary" />
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              Cursos Disponíveis
            </h2>
          </div>

          <div className="space-y-8">
            {categoryCourses.map((course, courseIndex) => (
              <Card
                key={course.id}
                className="bg-white border border-brand-primary/20 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="grid lg:grid-cols-3 gap-0">
                  <div className="relative h-64 lg:h-auto">
                    <Image
                      src={course.thumbnailUrl || "/placeholder.svg"}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 lg:bottom-6 lg:left-6">
                      <Badge className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white border-0 mb-2 font-bold">
                        Curso {courseIndex + 1}
                      </Badge>
                      <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">{course.title}</h3>
                      <p className="text-white/90 text-sm flex items-center gap-2">
                        <Crown className="h-4 w-4 text-brand-primary" />
                        By {course.instructor}
                      </p>
                    </div>
                  </div>

                  <CardContent className="lg:col-span-2 p-6 lg:p-8">
                    <p className="text-gray-700 mb-6 leading-relaxed text-lg">{course.description}</p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-brand-primary" />
                          Aulas do Curso
                        </h4>
                        <Badge variant="outline" className="border border-brand-primary text-brand-primary font-bold">
                          {course.lessons.length} aulas
                        </Badge>
                      </div>

                      {course.lessons.map((lesson, index) => (
                        <Link
                          key={lesson.id}
                          href={lesson.isLocked ? "#" : `/aulas/aula/${lesson.id}`}
                          className={lesson.isLocked ? "pointer-events-none" : ""}
                        >
                          <div
                            className={`
                            group flex items-center gap-4 p-4 rounded-lg transition-all duration-300 border-2
                            ${
                              lesson.isLocked
                                ? "bg-gray-100 border-gray-200 opacity-60"
                                : "hover:bg-brand-primary/10 cursor-pointer border-brand-primary/20 hover:border-brand-primary"
                            }
                          `}
                          >
                            <div className="flex-shrink-0 relative">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg">
                                {lesson.isCompleted ? (
                                  <CheckCircle className="h-6 w-6 text-white" />
                                ) : lesson.isLocked ? (
                                  <Lock className="h-6 w-6 text-gray-500" />
                                ) : (
                                  <Play className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                                )}
                              </div>
                              {!lesson.isLocked && !lesson.isCompleted && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-sm text-gray-500 font-bold">
                                  {String(index + 1).padStart(2, "0")}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="border-brand-primary text-brand-primary text-xs font-bold"
                                >
                                  {lesson.duration}
                                </Badge>
                                {lesson.isCompleted && (
                                  <Badge className="bg-green-500 text-white text-xs">Concluído</Badge>
                                )}
                              </div>
                              <h5 className="font-bold text-gray-800 group-hover:text-brand-primary transition-colors">
                                {lesson.title}
                              </h5>
                              <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                            </div>

                            {!lesson.isLocked && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold hover:brightness-110"
                                >
                                  Assistir Agora
                                </Button>
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
