"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Award, TrendingUp, Flame, Star, BookOpen, Gift, Folder, Check } from "lucide-react"
import { formatPrice } from "@/helper/FormatPrice"
import { CourseCardProps } from "@/type"
import parse from "html-react-parser"
import { Progress } from "@/components/ui/progress"

const BadgeStyles = {
  bestseller: "bg-amber-400/20 text-amber-200 border-amber-400/40",
  trending: "bg-sky-400/20 text-sky-200 border-sky-400/40",
  popular: "bg-emerald-400/20 text-emerald-200 border-emerald-400/40",
  featured: "bg-violet-400/20 text-violet-200 border-violet-400/40",
}

export default function EnhancedCourseCard({ course, hidePrice = false }: CourseCardProps & { hidePrice?: boolean }) {
  const [isHovered, setIsHovered] = useState(false)
  const isFree = !course.paid
  const [courseProgress, setCourseProgress] = useState<{
    percentage: number;
    completedChapters: number;
    totalChapters: number;
  }>({
    percentage: 0,
    completedChapters: 0,
    totalChapters: 0
  });

  const getImageUrl = (image: string | null | undefined) => {
    if (!image) return 'https://placehold.co/600x400?text=No+Image';
    if (image.startsWith('http')) return image;
    return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
  };

  useEffect(() => {
    if (hidePrice) {
      const fetchCourseProgress = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/user-progress/course/${course.id}`,
            {
              credentials: 'include',
            }
          );
          const data = await response.json();
          if (data.success) {
            setCourseProgress({
              percentage: data.data.percentage || 0,
              completedChapters: data.data.completedCount || 0,
              totalChapters: data.data.totalChapters || 0
            });
          }
        } catch (error) {
          console.error("Failed to fetch course progress:", error);
        }
      };

      fetchCourseProgress();
    }
  }, [course.id, hidePrice]);

  const courseUrl = hidePrice
    ? `/courses/${course.slug}/${course.id}`
    : `/courses/${course.slug}`;

  return (
    <Link
      href={courseUrl}
      className="block group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full max-w-md mx-auto overflow-hidden bg-white rounded-lg shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 h-full">
        {/* Thumbnail with Overlay */}
        <div className="relative h-48 overflow-hidden">
          <Image
            src={getImageUrl(course.thumbnail)}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges Container */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2 max-w-[calc(100%-24px)]">
            {course.isBestseller && (
              <Badge className={`${BadgeStyles.bestseller} backdrop-blur-sm`}>
                <Award className="w-3.5 h-3.5 mr-1" /> Bestseller
              </Badge>
            )}
            {course.isTrending && (
              <Badge className={`${BadgeStyles.trending} backdrop-blur-sm`}>
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> Trending
              </Badge>
            )}
            {course.isPopular && (
              <Badge className={`${BadgeStyles.popular} backdrop-blur-sm`}>
                <Flame className="w-3.5 h-3.5 mr-1" /> Popular
              </Badge>
            )}
            {course.isFeatured && (
              <Badge className={`${BadgeStyles.featured} backdrop-blur-sm`}>
                <Star className="w-3.5 h-3.5 mr-1" /> Featured
              </Badge>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 space-y-4">
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
            {course.title}
          </h3>

          {/* Description */}
          <div className="text-sm text-gray-600 line-clamp-2">
            {parse(course.description ?? "")}
          </div>

          {/* Meta Tags */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-gray-50/50">
              <BookOpen className="w-3.5 h-3.5 mr-1 text-gray-500" />
              {course.language}
            </Badge>
            <Badge variant="outline" className="bg-gray-50/50">
              <Folder className="w-3.5 h-3.5 mr-1 text-gray-500" />
              {course?.category?.name}
            </Badge>
          </div>

          {/* Price or Progress Section */}
          <div className="pt-4 border-t border-gray-100">
            {hidePrice ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-gradient-to-r from-blue-600 to-blue-800 text-white border-0">
                    <Check className="w-3.5 h-3.5 mr-1" /> Enrolled
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {courseProgress.completedChapters}/{courseProgress.totalChapters} Chapters
                  </span>
                </div>
                <Progress value={courseProgress.percentage} className="h-1.5 bg-gray-100" />
                <span className="text-xs text-gray-500 block text-right">
                  {Math.round(courseProgress.percentage)}% Complete
                </span>
              </div>
            ) : isFree ? (
              <Badge variant="secondary" className="bg-gradient-to-r from-green-600 to-emerald-700 text-white border-0">
                <Gift className="w-3.5 h-3.5 mr-1" /> Free Access
              </Badge>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                {(course.salePrice ?? 0) > 0 ? (
                  <>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(course.salePrice ?? 0)}
                    </span>
                    <span className="text-base text-gray-400 line-through">
                      {formatPrice(course.price)}
                    </span>
                    <Badge className="bg-red-600 text-white border-0">
                      Save {Math.round(((course.price - (course.salePrice ?? 0)) / course.price) * 100)}%
                    </Badge>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(course.price)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}