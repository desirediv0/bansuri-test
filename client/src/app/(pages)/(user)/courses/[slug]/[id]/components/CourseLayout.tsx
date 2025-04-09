"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { CourseDataNew, ChapterDataNew } from "@/type"
import { toast } from "sonner"
import LoadingSkeleton from "./LoadingSkeleton"
import ErrorDisplay from "./ErrorDisplay"
import VideoPlayer from "./VideoPlayer"
import ChapterList from "./ChapterList"
import ChapterDetails from "./ChapterDetails"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { useAuth } from "@/helper/AuthContext"
import PurchaseDialog from "../PurchaseDialog"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useMediaQuery } from "./use-media"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CourseLayoutProps {
  initialCourseData: CourseDataNew
  slug: string
}

interface CourseProgress {
  percentage: number;
  completedChapters: string[];
  isCompleted: boolean;
}

const CourseLayout: React.FC<CourseLayoutProps> = ({ initialCourseData, slug }) => {
  const router = useRouter()
  const { checkAuth } = useAuth()
  const [course] = useState<CourseDataNew>(initialCourseData)
  const [selectedChapter, setSelectedChapter] = useState<ChapterDataNew | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPurchaseChecked, setIsPurchaseChecked] = useState(false)
  const [isVideoLoading, setIsVideoLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPurchased, setIsPurchased] = useState<boolean>(false)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true)
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [chapterProgress, setChapterProgress] = useState<{
    isCompleted: boolean;
    watchedTime: number;
  } | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress>({
    percentage: 0,
    completedChapters: [],
    isCompleted: false
  });

  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth")
          throw new Error("Not authenticated")
        }
        throw new Error("Request failed")
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Request failed")
      }
      return data
    } catch (error) {
      console.error("Request error:", error)
      throw error
    }
  }

  const canAccessCourse = () => {
    return !course.paid || isPurchased;
  };

  const checkPurchaseStatus = async () => {
    setIsLoading(true)
    try {
      if (course.paid) {
        const data = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL}/purchase/${course.id}`)
        const hasPurchased = data.message?.purchased;
        setIsPurchased(hasPurchased)
        setIsPurchaseChecked(true)
        return hasPurchased;
      } else {
        setIsPurchased(true)
        setIsPurchaseChecked(true)
        return true;
      }
    } catch (err) {
      console.error("Purchase check error:", err)
      setError("Failed to check purchase status")
      return false;
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const isAuth = await checkAuth()
        if (!isAuth) {
          router.push("/auth")
          return;
        }

        const hasPurchased = await checkPurchaseStatus()

        if (course.paid && !hasPurchased) {
          router.push(`/courses/${slug}`)
          toast.error("Please purchase this course to access the content")
          return;
        }

        if (course?.sections?.length > 0) {
          const firstChapter = course.sections.flatMap((s) => s.chapters || []).find((chapter) => chapter);
          if (firstChapter) {
            setSelectedChapter(firstChapter)
            await loadVideoUrl(firstChapter.slug)
          }
        }
      } catch (error) {
        console.error("Auth error:", error);
        setError("Authentication failed")
      }
    }
    initializeAuth()
  }, [checkAuth, slug])

  const loadVideoUrl = async (chapterSlug: string) => {
    setIsVideoLoading(true)
    try {
      const data = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL}/chapter/url/${chapterSlug}`, {
        method: "POST",
      })
      setVideoUrl(data.message)
    } catch (err) {
      console.error("Failed to fetch video URL:", err)
      toast.error("Failed to load video. Please try again.")
    } finally {
      setIsVideoLoading(false)
    }
  }

  const fetchCourseProgress = async () => {
    try {
      const data = await makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_API_URL}/user-progress/course/${course.id}`
      );
      setCourseProgress({
        percentage: data.data.percentage || 0,
        completedChapters: Array.isArray(data.data.completedChapters)
          ? data.data.completedChapters
          : [],
        isCompleted: data.data.percentage === 100
      });
    } catch (err) {
      console.error("Failed to fetch course progress:", err);
      setCourseProgress({
        percentage: 0,
        completedChapters: [],
        isCompleted: false
      });
    }
  };

  useEffect(() => {
    const initProgress = async () => {
      if (isPurchaseChecked && course.id) {
        await fetchCourseProgress();
      }
    };
    initProgress();
  }, [isPurchaseChecked, course.id]);

  const handleVideoProgress = async (progress: { playedSeconds: number }) => {
    if (selectedChapter) {
      try {
        await makeAuthenticatedRequest(
          `${process.env.NEXT_PUBLIC_API_URL}/user-progress/update`,
          {
            method: "POST",
            body: JSON.stringify({
              chapterId: selectedChapter.id,
              watchedTime: progress.playedSeconds,
            }),
          }
        );
        await fetchCourseProgress();
      } catch (err) {
        console.error("Failed to update progress:", err);
      }
    }
  };

  const handleVideoEnded = async () => {
    if (selectedChapter) {
      try {
        await makeAuthenticatedRequest(
          `${process.env.NEXT_PUBLIC_API_URL}/user-progress/complete`,
          {
            method: "POST",
            body: JSON.stringify({
              chapterId: selectedChapter.id,
              watchedTime: selectedChapter.duration || 100
            }),
          }
        );

        setChapterProgress({
          isCompleted: true,
          watchedTime: selectedChapter.duration || 100
        });

        await fetchCourseProgress();

        if (courseProgress.percentage === 100) {
          toast.success("🎉 Congratulations! You've completed the entire course!");
          router.push("/user-profile");
        } else {
          const nextChapter = getNextChapter();
          if (nextChapter) {
            toast.success("Chapter completed! Moving to next chapter...");
            setSelectedChapter(nextChapter);
            loadVideoUrl(nextChapter.slug);
            const progressData = await makeAuthenticatedRequest(
              `${process.env.NEXT_PUBLIC_API_URL}/user-progress/chapter/${nextChapter.id}`
            );
            setChapterProgress(progressData.data);
          } else {
            toast.success("Congratulations! You've completed all chapters!");
          }
        }
      } catch (err) {
        console.error("Failed to mark chapter as complete:", err);
        toast.error("Failed to mark chapter as complete");
      }
    }
  };

  const getNextChapter = () => {
    if (!selectedChapter || !course.sections) return null;

    const currentSectionIndex = course.sections.findIndex((section) =>
      section.chapters.some((chapter) => chapter.id === selectedChapter.id)
    );
    const currentSection = course.sections[currentSectionIndex];
    const currentChapterIndex = currentSection.chapters.findIndex(
      (chapter) => chapter.id === selectedChapter.id
    );

    if (currentChapterIndex < currentSection.chapters.length - 1) {
      return currentSection.chapters[currentChapterIndex + 1];
    }

    if (currentSectionIndex < course.sections.length - 1) {
      return course.sections[currentSectionIndex + 1].chapters[0];
    }

    return null;
  };

  const handleChapterClick = async (chapter: ChapterDataNew) => {
    if (!canAccessCourse() && !chapter.isFree) {
      toast.error("Please purchase this course to access this chapter")
      return;
    }

    // Remove section completion check to allow free navigation between chapters
    setSelectedChapter(chapter);
    if (!course.paid || chapter.isFree || isPurchased) {
      try {
        await loadVideoUrl(chapter.slug);
        const data = await makeAuthenticatedRequest(
          `${process.env.NEXT_PUBLIC_API_URL}/user-progress/chapter/${chapter.id}`
        );
        setChapterProgress(data.data);
      } catch (err) {
        console.error("Failed to fetch chapter data:", err);
        toast.error("Failed to load chapter content. Please try again.");
      }
    } else {
      setIsDialogOpen(true);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorDisplay error={error} onRetry={checkPurchaseStatus} />

  const SidebarContent = (
    <ChapterList
      course={{
        ...course,
        sections: course?.sections || [],
      }}
      selectedChapter={selectedChapter}
      isPurchased={isPurchased}
      onChapterClick={handleChapterClick}
      canAccessContent={!course.paid || isPurchased}
      completedChapters={courseProgress.completedChapters || []}
      courseProgress={courseProgress.percentage}
    />
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-plus-jakarta-sans mt-10 md:mt-12">
      <div className="flex flex-1 overflow-hidden">
        {isDesktop ? (
          <div
            className={`${isSidebarOpen ? "w-[300px]" : "w-0"
              } transition-all duration-300 ease-in-out overflow-hidden border-r shadow-xl bg-white`}
          >
            <ScrollArea className="h-full">{SidebarContent}</ScrollArea>
          </div>
        ) : (
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
              <ScrollArea className="h-full pt-12">{SidebarContent}</ScrollArea>
            </SheetContent>
          </Sheet>
        )}

        <div className="flex flex-col flex-1 overflow-hidden mt-20">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4 relative z-10">
              <VideoPlayer
                videoUrl={videoUrl}
                isLoading={isVideoLoading}
                onProgress={handleVideoProgress}
                onDuration={() => { }}
                onEnded={handleVideoEnded}
                className={`w-full bg-white rounded-lg shadow-md transition-all duration-300 ease-in-out ${isSidebarOpen ? "aspect-[21/9]" : "aspect-video"
                  }`}
                initialProgress={chapterProgress?.watchedTime || 0}
                isCompleted={chapterProgress?.isCompleted || false}
                chapterId={selectedChapter?.id || ''}
              />
              <div className="bg-white rounded-lg shadow-md p-6 relative z-10">
                <ChapterDetails chapter={selectedChapter} />
              </div>
            </div>
          </ScrollArea>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleSidebar}
            className={`fixed z-50 h-10 px-2 bg-white/95 backdrop-blur-sm hover:bg-gradient-to-r hover:from-[#fce7ff] hover:to-[#fff1eb] border border-[#610981]/20 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out group left-0 top-1/2 -translate-y-1/2 rounded-r-lg`}
          >
            {isSidebarOpen ? (
              <ChevronLeft className="h-5 w-5 text-[#610981] group-hover:scale-110 transition-transform duration-200" />
            ) : (
              <ChevronRight className="h-5 w-5 text-[#610981] group-hover:scale-110 transition-transform duration-200" />
            )}
          </Button>
        </div>
      </div>

      <PurchaseDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        courseSlug={course.slug || ""}
        coursePrice={course.price}
        onPurchaseSuccess={() => {
          setIsPurchased(true)
          setIsDialogOpen(false)
          if (selectedChapter) {
            loadVideoUrl(selectedChapter.slug)
          }
        }}
      />
    </div>
  )
}

export default CourseLayout

