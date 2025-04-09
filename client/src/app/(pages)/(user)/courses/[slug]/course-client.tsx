"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import Image from "next/image"
import Link from "next/link"
import {
  PlayCircle,
  Book,
  Award,
  ChevronRight,
  Languages,
  ShoppingCart,
  AlertTriangle,
  Pause,
  Lock,
  Folder,
  Check,
  MessageCircle,
} from "lucide-react"
import parse from "html-react-parser"
import { Element } from "domhandler"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/helper/AuthContext"
import { toast } from "sonner"
import ReactPlayer from "react-player"
import { ErrorComponent, LoadingSkeleton } from "./course-loading-error"
import FreeChapterDialog from "./FreeChapterDialog"
import { formatPrice } from "@/helper/FormatPrice"
import ReviewSection from "./review-section"
import { motion } from "framer-motion"

interface Chapter {
  id: string
  title: string
  isFree: boolean
  description: string
  slug: string
}

interface Category {
  id: string
  name: string
}

interface Section {
  id: string
  title: string
  chapters: Chapter[]
}

interface Review {
  id: string
  rating: number
  comment: string
  user: {
    name: string
    avatar: string
  }
}

interface CourseData {
  id: string
  title: string
  description: string
  thumbnail: string
  price: number
  salePrice?: number
  paid: boolean
  language: string
  subheading: string
  videoUrl: string
  isBestseller: boolean
  isTrending: boolean
  isPopular: boolean
  isFeatured: boolean
  metaTitle: string
  metaDesc: string
  sections: Section[]
  category: Category
  reviews: Review[]
  userId: string
}

interface CourseClientProps {
  initialCourseData: CourseData
  slug: string
}

const CourseClient: React.FC<CourseClientProps> = ({ initialCourseData, slug }) => {
  const [isLoading] = useState(false)
  const [error] = useState<string | null>(null)
  const [course] = useState<CourseData>(initialCourseData)
  const [hasPurchased, setHasPurchased] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoError, setVideoError] = useState<string | boolean>(false)
  const { isAuthenticated } = useAuth()
  const [defaultSection, setDefaultSection] = useState<string>("")
  const [isClient, setIsClient] = useState(false)
  const [selectedChapter, setSelectedChapter] = useState<{
    id: string
    title: string
  } | null>(null)
  const [freeChapterVideo, setFreeChapterVideo] = useState<string | null>(null)
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const checkEnrollmentStatus = useCallback(async (courseId: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/enrollment/check/${courseId}`)
      return response.data.message === "Enrolled in course"
    } catch (error) {
      console.error("Error checking enrollment status:", error)
      return false
    }
  }, [])

  const checkPurchaseStatus = useCallback(async (courseId: string) => {
    try {
      const purchaseResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/purchase/${courseId}`)
      return purchaseResponse.data.data === "Course purchased"
    } catch (error) {
      console.error("Error checking purchase status:", error)
      return false
    }
  }, [])

  useEffect(() => {
    const checkEnrollmentAndPurchaseStatus = async () => {
      if (isAuthenticated) {
        if (!course.paid) {
          const enrollmentStatus = await checkEnrollmentStatus(course.id)
          setIsEnrolled(enrollmentStatus)
        } else {
          const purchaseStatus = await checkPurchaseStatus(course.id)
          setHasPurchased(purchaseStatus)
        }
      }
    }

    checkEnrollmentAndPurchaseStatus()
  }, [course, isAuthenticated, checkEnrollmentStatus, checkPurchaseStatus])

  useEffect(() => {
    const sectionsWithChapters =
      course?.sections?.filter((section) => section?.chapters && section.chapters.length > 0) || []

    const firstSectionWithChapters = sectionsWithChapters[0]
    if (firstSectionWithChapters) {
      setDefaultSection(firstSectionWithChapters.id)
    }
  }, [course])

  const handleEnrollment = async () => {
    if (!isAuthenticated) {
      window.location.href = `/auth?course-slug=${slug}`
      return
    }

    if (course.paid) {
      try {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
          courseId: course.id,
        })
        toast.success("Course added to cart")
        window.location.href = `/buy?course-slug=${slug}`
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          toast.error(error.response.data.message || "Error adding course to cart")
        }
      }
    } else {
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/enrollment/enroll`,
          { courseId: course.id },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        )
        toast.success("Successfully enrolled in course")
        setIsEnrolled(true)
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          if (error.response.data.message.includes("Already enrolled")) {
            setIsEnrolled(true)
          } else {
            toast.error(error.response.data.message || "Error enrolling in course")
          }
        }
      }
    }
  }

  const getFirstAvailableChapter = (sections: Section[]): { slug: string; id: string } | null => {
    for (const section of sections) {
      if (section.chapters && section.chapters.length > 0) {
        return {
          slug: section.chapters[0].slug,
          id: section.chapters[0].id,
        }
      }
    }
    return null
  }

  const sectionsWithChapters =
    course?.sections?.filter((section) => section?.chapters && section.chapters.length > 0) || []

  const hasSections = sectionsWithChapters.length > 0

  const renderEnrollmentButton = () => {
    if (!course) return null

    if ((course.paid && hasPurchased) || (!course.paid && isEnrolled)) {
      const firstChapter = getFirstAvailableChapter(course.sections)
      if (!firstChapter) {
        return (
          <Button className="w-full" size="lg" disabled>
            No Chapters Available
            <AlertTriangle className="w-4 h-4 ml-2" />
          </Button>
        )
      }
      return (
        <Link href={`/courses/${slug}/${firstChapter.id}`} className="block w-full">
          <Button className="w-full bg-red-500 hover:bg-red-600 text-white" size="lg">
            Continue Learning
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      )
    }
    return (
      <Button
        onClick={handleEnrollment}
        className="w-full bg-red-500 hover:bg-red-600 text-white transition-colors duration-300"
        size="lg"
        variant="default"
        disabled={!hasSections}
      >
        {course.paid ? (
          <>
            Add to Cart
            <ShoppingCart className="w-4 h-4 ml-2" />
          </>
        ) : (
          <>
            Enroll Now
            <ChevronRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    )
  }

  const cleanHtml = (html: string) => {
    return html
      .replace(/<(ul|ol)>\s*<\/\1>/g, "")
      .replace(/<li>\s*<\/li>/g, "")
      .replace(/<p>\s*<\/p>/g, "")
      .replace(/<[^>]*>\s*<\/[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim()
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
    setVideoError(false)
  }

  const handleChapterClick = (chapter: Chapter) => {
    if (!course.paid) {
      if (isEnrolled) {
        window.location.href = `/courses/${slug}/${chapter.id}`
        return
      } else {
        handleEnrollment()
        return
      }
    }
    if (chapter.isFree) {
      setSelectedChapter({ id: chapter.id, title: chapter.title })
      setIsLoadingVideo(true)
      setVideoError(false)
      setFreeChapterVideo(null)

      axios
        .get(`${process.env.NEXT_PUBLIC_API_URL}/course/free-chapter-video/${slug}/${chapter.id}`)
        .then((response) => {
          setFreeChapterVideo(response.data.data.videoUrl)
        })
        .catch((error) => {
          setVideoError("Failed to load video. Please try again later.")
          console.error("Error loading free chapter video:", error)
        })
        .finally(() => {
          setIsLoadingVideo(false)
        })
    } else if (hasPurchased) {
      window.location.href = `/courses/${slug}/${chapter.id}`
    }
  }

  // Add this helper function to handle image URLs
  const getImageUrl = (image: string | null | undefined) => {
    if (!image) return 'https://placehold.co/600x400?text=No+Image';
    if (image.startsWith('http')) return image;
    return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
  };

  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorComponent error={error} />

  return (
    <div className="min-h-screen bg-gray-50 font-plus-jakarta-sans">
      {/* Course Header */}
      <div className="bg-gradient-to-t from-[#ef5252] to-[#000000c1] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="container mx-auto px-4 py-12 md:py-16 max-w-7xl relative z-10 mt-14">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
            {/* Course Info */}
            <div className="order-2 md:order-1 space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {course.isBestseller && (
                  <Badge variant="secondary" className="bg-yellow-400/20 text-yellow-200 border-yellow-400/40">
                    <Award className="w-4 h-4 mr-1" /> Bestseller
                  </Badge>
                )}
                {course.isTrending && (
                  <Badge variant="secondary" className="bg-blue-400/20 text-blue-200 border-blue-400/40">
                    📈 Trending
                  </Badge>
                )}
                {course.isPopular && (
                  <Badge variant="secondary" className="bg-green-400/20 text-green-200 border-green-400/40">
                    🔥 Popular
                  </Badge>
                )}
                {course.isFeatured && (
                  <Badge variant="secondary" className="bg-purple-400/20 text-purple-200 border-purple-400/40">
                    ⭐ Featured
                  </Badge>
                )}
              </div>
              {/* Title & Subheading */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-4 md:space-y-6"
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold capitalize leading-tight tracking-tight">
                  <span className="inline-block">{course.title}</span>
                </h1>
                {course.subheading && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="text-base sm:text-lg md:text-xl text-white/80 font-medium max-w-3xl leading-relaxed"
                  >
                    {course.subheading}
                  </motion.p>
                )}
              </motion.div>

              {/* Course Meta Info */}
              <div className="grid md:grid-cols-2  gap-3 md:gap-6">
                {/* Language */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-white/10 rounded-xl p-4 md:p-5 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-all duration-300"
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Languages className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                    </div>
                    <div className="space-y-0.5 md:space-y-1">
                      <span className="text-xl md:text-2xl font-bold capitalize truncate">{course.language}</span>
                      <p className="text-xs md:text-sm text-white/70">Language</p>
                    </div>
                  </div>
                </motion.div>
                {/* Category */}
                {course.category && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="bg-white/10 rounded-xl p-4 md:p-5 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <Folder className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
                      </div>
                      <div className="space-y-0.5 md:space-y-1">
                        <span className="text-xl md:text-2xl font-bold truncate">{course.category.name}</span>
                        <p className="text-xs md:text-sm text-white/70">Category</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Video/Thumbnail */}
            <div
              className="relative w-full max-w-md mx-auto md:max-w-[50%] aspect-video rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/20 group"
            >
              {/* Thumbnail Image - Always visible when not playing */}
              <div
                className={`absolute inset-0 transition-opacity duration-300 ${isPlaying ? "opacity-0" : "opacity-100"
                  }`}
              >
                <Image
                  src={getImageUrl(course.thumbnail)}
                  alt={course.title}
                  fill
                  style={{ objectFit: "cover" }}
                  className="transition-transform duration-300 hover:scale-105"
                />
              </div>

              {/* Video Player - Only visible when playing and video URL exists */}
              {isClient && course.videoUrl && (
                <div
                  className={`absolute inset-0 transition-opacity duration-300 ${isPlaying ? "opacity-100" : "opacity-0"
                    }`}
                >
                  <ReactPlayer
                    url={course.videoUrl}
                    width="100%"
                    height="100%"
                    playing={isPlaying}
                    controls={false}
                    onPause={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onError={() => setVideoError(true)}
                    className="rounded-xl overflow-hidden"
                  />
                </div>
              )}
              {!videoError && course.videoUrl && (
                <button
                  onClick={togglePlayPause}
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-300
                    ${isPlaying
                      ? "bg-transparent group-hover:bg-black/20 opacity-0 group-hover:opacity-100"
                      : "bg-black/30 hover:bg-black/20 opacity-100"}`}
                >
                  {isPlaying ? (
                    <Pause className="w-20 h-20 text-white transition-transform hover:scale-110 opacity-0 group-hover:opacity-100" />
                  ) : (
                    <PlayCircle className="w-20 h-20 text-white transition-transform hover:scale-110" />
                  )}
                </button>
              )}

              {/* Error Message */}
              {videoError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
                  <p>Sorry, the video could not be played.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Course Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Description, Content, and Reviews */}
          <div className="lg:col-span-2 order-2 lg:order-none">
            <Card>
              <CardContent className="p-0">
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="w-full justify-start rounded-none border-b bg-white p-1 flex-nowrap">
                    <TabsTrigger
                      value="description"
                      className="flex-shrink-0 flex items-center gap-2 px-4 sm:px-6 py-3 data-[state=active]:bg-red-50 
                      data-[state=active]:text-red-600 data-[state=active]:border-b-2 
                      data-[state=active]:border-red-600 transition-all duration-200"
                    >
                      <Book className="w-4 h-4" />
                      <span className="hidden sm:inline">Description</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="content"
                      className="flex-shrink-0 flex items-center gap-2 px-4 sm:px-6 py-3 data-[state=active]:bg-red-50 
                      data-[state=active]:text-red-600 data-[state=active]:border-b-2 
                      data-[state=active]:border-red-600 transition-all duration-200"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Course Content</span>
                      <Badge variant="secondary" className="ml-2 bg-red-100 text-red-600 hover:bg-red-200">
                        {sectionsWithChapters.reduce((total, section) => total + section.chapters.length, 0)}
                      </Badge>
                    </TabsTrigger>

                    <TabsTrigger
                      value="reviews"
                      className="flex-shrink-0 flex items-center gap-2 px-4 sm:px-6 py-3 data-[state=active]:bg-red-50 
                      data-[state=active]:text-red-600 data-[state=active]:border-b-2 
                      data-[state=active]:border-red-600 transition-all duration-200"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Reviews</span>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="description" className="p-6">
                    <div className="prose prose-lg dark:prose-invert">
                      {course.description
                        ? parse(cleanHtml(course.description), {
                          replace: (domNode) => {
                            if (
                              domNode instanceof Element &&
                              (!domNode.children?.length ||
                                (domNode.children.length === 1 &&
                                  "data" in domNode.children[0] &&
                                  !domNode.children[0].data?.trim()))
                            ) {
                              return <></>
                            }
                            return domNode
                          },
                        })
                        : "No description available"}
                    </div>
                  </TabsContent>
                  <TabsContent value="content" className="p-6">
                    <Accordion type="single" defaultValue={defaultSection} collapsible className="space-y-4">
                      {sectionsWithChapters.length > 0 ? (
                        sectionsWithChapters.map((section, sectionIndex) => (
                          <AccordionItem key={section.id} value={section.id} className="border rounded-lg">
                            <AccordionTrigger className="px-4 py-3 bg-gray-50 hover:bg-gray-100">
                              <div className="flex items-center gap-3">
                                <span className="text-red-600 font-semibold">Section {sectionIndex + 1}:</span>
                                <span className="font-medium">{section.title}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 p-4">
                                {section.chapters.map((chapter) => (
                                  <div
                                    key={chapter.id}
                                    className={`flex flex-col gap-2 p-3 rounded-lg transition-all duration-200 border ${(!course.paid && isEnrolled) || chapter.isFree || hasPurchased
                                      ? "hover:bg-gray-50 cursor-pointer"
                                      : "opacity-90 bg-gray-50"
                                      }`}
                                    onClick={() => handleChapterClick(chapter)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        {chapter.isFree ||
                                          (course.paid && hasPurchased) ||
                                          (!course.paid && isEnrolled) ? (
                                          <PlayCircle className="w-5 h-5 text-red-600" />
                                        ) : (
                                          <Lock className="w-5 h-5 text-gray-400" />
                                        )}
                                        <span
                                          className={`font-medium ${chapter.isFree ||
                                            (course.paid && hasPurchased) ||
                                            (!course.paid && isEnrolled)
                                            ? ""
                                            : "text-gray-800"
                                            }`}
                                        >
                                          {chapter.title}
                                        </span>
                                      </div>
                                      <Badge
                                        variant={
                                          chapter.isFree
                                            ? "secondary"
                                            : (course.paid && hasPurchased) || (!course.paid && isEnrolled)
                                              ? "default"
                                              : "outline"
                                        }
                                        className={
                                          chapter.isFree
                                            ? "bg-green-100 text-green-800"
                                            : (course.paid && hasPurchased) || (!course.paid && isEnrolled)
                                              ? "bg-red-600 text-white"
                                              : "text-gray-700"
                                        }
                                      >
                                        {chapter.isFree
                                          ? "Free"
                                          : (course.paid && hasPurchased) || (!course.paid && isEnrolled)
                                            ? "Enrolled"
                                            : "Premium"}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
                          <p className="text-lg font-semibold text-gray-700">No content available</p>
                          <p className="text-gray-500">This course doesn&apos;t have any sections or chapters yet.</p>
                        </div>
                      )}
                    </Accordion>
                  </TabsContent>
                  <TabsContent value="reviews" className="p-6">
                    <ReviewSection
                      courseId={course.id}
                      isEnrolled={isEnrolled}
                      hasPurchased={hasPurchased}
                      userId={course.userId}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Price Card */}
          <div className="lg:col-span-1 order-1 lg:order-none">
            <Card className="sticky top-28 overflow-hidden border-0 shadow-xl bg-white/95 backdrop-blur-sm mb-8 lg:mb-0">
              {/* Price Header Section */}
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10" />
                <CardHeader className="space-y-4 relative">
                  <CardTitle className="space-y-4">
                    {(course.paid && hasPurchased) || (!course.paid && isEnrolled) ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center gap-3 p-4"
                      >
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 text-base px-6 py-2 rounded-full border-green-200"
                        >
                          Enrolled Successfully
                        </Badge>
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 p-4">
                        {course.paid ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                          >
                            <div className="flex items-center justify-center gap-2 mb-2">
                              {course.salePrice ? (
                                <>
                                  {/* Sale Price */}
                                  <span className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                                    {formatPrice(course.salePrice)}
                                  </span>
                                  {/* Original Price */}
                                  <span className="text-lg text-gray-500 line-through ml-2">
                                    {formatPrice(course.price)}
                                  </span>
                                  {/* Discount Badge */}
                                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                                    Save {Math.round(((course.price - course.salePrice) / course.price) * 100)}%
                                  </Badge>
                                </>
                              ) : (
                                <>
                                  {/* Regular Price */}
                                  <span className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                                    {formatPrice(course.price)}
                                  </span>
                                  <Badge variant="secondary" className="bg-red-100 text-red-700 uppercase text-xs">
                                    Premium
                                  </Badge>
                                </>
                              )}
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                          >
                            <span className="text-4xl font-bold text-green-600">FREE</span>
                            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                              Limited Time
                            </Badge>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
              </div>

              <CardContent className="space-y-6">
                {/* Enrollment Button */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  {renderEnrollmentButton()}
                </motion.div>

                {/* Course Features */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-4"
                >
                  {(!course.paid && isEnrolled) || (course.paid && hasPurchased) ? (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800">Course Progress</h3>
                      <ul className="space-y-3">
                        <li className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <Book className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800">Course Enrolled</p>
                            <p className="text-sm text-green-600">Start learning now</p>
                          </div>
                        </li>
                        <li className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <Award className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-blue-800">Certificate Available</p>
                            <p className="text-sm text-blue-600">Complete to earn</p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  ) : (
                    (

                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800">Course Includes</h3>
                        <ul className="space-y-3">
                          <li className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                            <PlayCircle className="w-5 h-5 text-red-600" />
                            <div>
                              <p className="font-medium text-gray-800">
                                {sectionsWithChapters.reduce((total, section) => total + section.chapters.length, 0)} Chapters
                              </p>
                              <p className="text-sm text-gray-600">Comprehensive content</p>
                            </div>
                          </li>
                          <li className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                            <Book className="w-5 h-5 text-red-600" />
                            <div>
                              <p className="font-medium text-gray-800">Lifetime Access</p>
                              <p className="text-sm text-gray-600">Learn at your pace</p>
                            </div>
                          </li>
                          <li className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                            <Award className="w-5 h-5 text-red-600" />
                            <div>
                              <p className="font-medium text-gray-800">Completion Certificate</p>
                              <p className="text-sm text-gray-600">Verify your achievement</p>
                            </div>
                          </li>
                        </ul>
                      </div>
                    )
                  )}
                </motion.div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {course.paid && (
        <FreeChapterDialog
          isOpen={!!selectedChapter}
          onClose={() => {
            setSelectedChapter(null)
            setFreeChapterVideo(null)
            setVideoError(false)
          }}
          chapterTitle={selectedChapter?.title || ""}
          videoUrl={freeChapterVideo}
          isLoading={isLoadingVideo}
          error={videoError}
        />
      )}
    </div>
  )
}

export default CourseClient

