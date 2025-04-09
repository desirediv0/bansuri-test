import { getCourse } from "@/lib/api";
import { AlertTriangle } from "lucide-react";
import { Metadata } from "next";
import CourseLayout from "./components/CourseLayout";
import { CourseDataNew } from "@/type";


type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const courseData = await getCourse(params.slug);
    return {
      title: courseData.metaTitle || `${courseData.title} | Bansuri Vidya Mandir `,
      description:
        courseData.metaDesc || `Learn ${courseData.title} on Bansuri Vidya Mandir `,
    };
  } catch {
    return {
      title: "Course Not Found | Bansuri Vidya Mandir ",
      description: "The requested course could not be found",
    };
  }
}

export default async function CoursePage({ params }: Props) {
  try {
    const courseData: CourseDataNew = await getCourse(params.slug);
    return <CourseLayout initialCourseData={courseData} slug={params.slug} />;
  } catch {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 font-plus-jakarta-sans">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <AlertTriangle className="h-16 w-16 text-yellow-400 animate-bounce" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Course Not Found
            </h2>
            <p className="mt-2 text-sm text-gray-600 font-inter ">
              We couldn&apos;t find the course you&apos;re looking for. It might
              have been removed or is no longer available.
            </p>
            <div className="mt-8 space-x-4">
              <a
                href="/courses"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium bg-red-600 hover:bg-red-700 hover:text-white text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Browse Courses
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
