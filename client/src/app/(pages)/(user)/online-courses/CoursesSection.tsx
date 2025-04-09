"use client"
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useCustomDebounce } from "@/hooks/useCustomDebounce";
import CourseCards from "../../_components/CourseCards";
import SkeletonCardGrid from "../../_components/SkeletonCardGrid";
import { CourseDataNew } from "@/type";
import CustomButton from "../../_components/CustomButton";
import { ArrowRight } from "lucide-react";

export default function CoursesSection() {
  const searchParams = useSearchParams();
  const marketParam = searchParams.get('market');

  const [courses, setCourses] = useState<CourseDataNew[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("oldest");
  const [categories, setCategories] = useState<{ id: string; name: string; }[]>([]);

  const debouncedSearch = useCustomDebounce(searchQuery, 500);


  // const fetchCategories = async () => {
  //     try {
  //       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/category`);
  //       if (!response.ok) throw new Error("Failed to fetch categories");
  //       const data = await response.json();
  //       if (data.success) {
  //         setCategories(data.data);
  //         // If market param exists, find and set matching category
  //         if (marketParam) {
  //           const matchingCategory = data.data.find(
  //             (cat: { name: string }) =>
  //               cat.name.toLowerCase() === marketParam.toLowerCase()
  //           );
  //           if (matchingCategory) {
  //             setSelectedCategory(matchingCategory.id);
  //           }
  //         }
  //       }
  //     } catch (error) {
  //       toast.error("Failed to load categories");
  //     }
  //   };

  const fetchCourses = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(selectedCategory !== "all" && { category: selectedCategory }),
        ...(sortBy && { sort: sortBy }),
        ...(marketParam && { market: marketParam }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/course/get-courses?${queryParams}`
      );

      if (!response.ok) throw new Error("Failed to fetch courses");

      const data = await response.json();
      if (data.success) {
        setCourses(data.data.courses);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      toast.error("An error occurred while fetching courses");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedCategory, sortBy, marketParam]);

  useEffect(() => {
    // fetchCategories();
  }, [marketParam]);

  useEffect(() => {
    setIsLoading(true);
    fetchCourses();
  }, [fetchCourses]);

  // const handleReset = () => {
  //   setSearchQuery("");
  //   setSelectedCategory("all");
  //   setSortBy("oldest");
  //   setCurrentPage(1);
  // };
  return (
    <>
      {isLoading && <SkeletonCardGrid />}

      {!isLoading && courses.length > 0 && (
        <CourseCards
          courses={courses}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
        />
      )}

      {!isLoading && courses.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-700">No courses found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
        </div>
      )}


    </>
  )
}
