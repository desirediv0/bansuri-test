"use client"

import type React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Play, Lock, ChevronRight, CheckCircle } from "lucide-react"
import type { CourseDataNew, ChapterDataNew } from "@/type"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

interface ChapterListProps {
  course: CourseDataNew
  selectedChapter: ChapterDataNew | null
  isPurchased: boolean
  onChapterClick: (chapter: ChapterDataNew) => void
  canAccessContent: boolean
  completedChapters: string[]
  courseProgress: number
}

const ChapterList: React.FC<ChapterListProps> = ({
  course,
  selectedChapter,
  onChapterClick,
  canAccessContent,
  completedChapters = [],
  courseProgress = 0,
}) => {
  const isChapterCompleted = (chapterId: string) => {
    return Array.isArray(completedChapters) && completedChapters.includes(chapterId);
  };

  const isChapterAccessible = (chapter: ChapterDataNew) => {
    return canAccessContent || chapter.isFree;
  };

  return (
    <div className="h-full bg-white font-plus-jakarta-sans md:mt-14">
      <div className="p-6 border-b bg-red-600 text-white">
        <h2 className="text-2xl font-bold">Course Content</h2>
        <div className="mt-2">
          <Progress value={courseProgress} className="w-full" />
          <p className="text-sm mt-1">{Math.round(courseProgress)}% Complete</p>
        </div>
      </div>
      <ScrollArea className="h-[calc(100vh-5rem)]">
        <div className="p-6">
          {course.sections &&
            course.sections
              .filter((section) => section.chapters && section.chapters.length > 0)
              .map((section, index) => (
                <div key={section.id} className="mb-8">
                  <h3 className="font-semibold text-lg mb-4 text-gray-700 flex items-center">
                    <span className="bg-red-100 text-red-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 font-bold">
                      {index + 1}
                    </span>
                    {section.title}
                  </h3>
                  <div className="space-y-2">
                    {section.chapters.map((chapter) => (
                      <Button
                        key={chapter.id}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start p-3 h-auto font-inter transition-all duration-300",
                          selectedChapter?.id === chapter.id
                            ? "bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-700"
                            : isChapterCompleted(chapter.id)
                              ? "bg-green-50"
                              : "bg-white hover:bg-gray-50",
                          !isChapterAccessible(chapter) && "opacity-60",
                          "group",
                        )}
                        onClick={() => onChapterClick(chapter)}
                        disabled={!isChapterAccessible(chapter)}
                      >
                        <div className="flex items-center w-full">
                          <div className="flex-shrink-0 mr-3">
                            {isChapterAccessible(chapter) ? (
                              isChapterCompleted(chapter.id) ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <Play className="h-5 w-5 text-green-500" />
                              )
                            ) : (
                              <Lock className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-grow">
                            <span className="text-left font-medium block">{chapter.title}</span>

                            {isChapterCompleted(chapter.id) && (
                              <span className="text-xs text-green-600">Completed</span>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors duration-300" />
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export default ChapterList

