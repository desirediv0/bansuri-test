"use client";
import { HeroSection } from "../../_components/HeroSectionProps";
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from 'next/navigation';
import { toast } from "sonner";
import { CourseDataNew } from "@/type";
import SkeletonCardGrid from "../../_components/SkeletonCardGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { useCustomDebounce } from "@/hooks/useCustomDebounce";
import CourseCards from "../../_components/CourseCards";

const Course = () => {
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

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/category`);
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
        // If market param exists, find and set matching category
        if (marketParam) {
          const matchingCategory = data.data.find(
            (cat: { name: string }) =>
              cat.name.toLowerCase() === marketParam.toLowerCase()
          );
          if (matchingCategory) {
            setSelectedCategory(matchingCategory.id);
          }
        }
      }
    } catch (error) {
      toast.error("Failed to load categories");
    }
  };

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
    fetchCategories();
  }, [marketParam]);

  useEffect(() => {
    setIsLoading(true);
    fetchCourses();
  }, [fetchCourses]);

  const handleReset = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSortBy("oldest");
    setCurrentPage(1);
  };


  return (
    <>
      <HeroSection
        smallText="All Courses"
        title="Explore our courses."
        variant="page"
        image={{
          src: "/rupak-sir.webp",
          alt: "Courses",
        }}
      />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col gap-4 mb-8">
          <div className="w-full">
            <div className="relative">
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 w-full"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="flex flex-col sm:flex-row gap-4 flex-grow">
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full sm:w-auto"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Reset Filters
            </Button>
          </div>
        </div>

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
      </div>
    </>
  );
};

export default Course;
