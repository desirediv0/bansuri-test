"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { CourseDataNew } from "@/type";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import CourseForm from "./CourseForm";

interface EditCourseProps {
  params: {
    slug: string;
  };
}

const EditCourse: React.FC<EditCourseProps> = ({ params }) => {
  const [courseData, setCourseData] = useState<CourseDataNew | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await axios.get<{
          data: CourseDataNew;
          success: boolean;
        }>(
          `${process.env.NEXT_PUBLIC_API_URL}/course/get-course/${params.slug}`
        );
        setCourseData(response.data.data);
      } catch {
        toast.error("Failed to fetch course");
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [params.slug, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!courseData) {
    return null;
  }

  const handleUpdateSuccess = (updatedData: CourseDataNew) => {
    setCourseData(updatedData);
  };

  return (
    <CourseForm
      isEditing={true}
      initialData={courseData}
      courseSlug={params.slug}
      onUpdateSuccess={handleUpdateSuccess}
    />
  );
};

export default EditCourse;
