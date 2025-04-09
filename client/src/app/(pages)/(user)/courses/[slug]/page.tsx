import { Metadata } from "next";
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { AlertTriangle } from "lucide-react";
import CourseLoading from "./loading";

// Import client component dynamically with ssr disabled
const CourseClient = dynamic(() => import("./course-client"), {
  ssr: false,
  loading: () => <CourseLoading />
});

async function getCourse(slug: string) {
  try {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      throw new Error("API URL not configured");
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/course/get-course-page/${slug}`,
      {
        cache: 'no-store',
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch course: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching course:", error);
    return {
      error: true,
      message: "Failed to fetch course",
      data: null
    };
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const courseData = await getCourse(params.slug);

  if (courseData.error || !courseData.data) {
    return {
      title: "Course Not Found | Bansuri Vidya Mandir",
      description: "The requested course could not be found.",
    };
  }

  const { data } = courseData;

  return {
    title: data.metaTitle || data.title || "Bansuri Vidya Mandir",
    description: data.metaDesc || data.subheading || "Learn Indian Classical Music",
    openGraph: {
      title: data.title,
      description: data.subheading || data.metaDesc,
      images: [`${process.env.NEXT_PUBLIC_IMAGE_URL}/${data.thumbnail}`],
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: data.subheading || data.metaDesc,
      images: [`${process.env.NEXT_PUBLIC_IMAGE_URL}/${data.thumbnail}`],
    },
  };
}

export default async function CoursePage({ params }: { params: { slug: string } }) {
  const courseData = await getCourse(params.slug);

  if (courseData.error || !courseData.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <AlertTriangle className="h-16 w-16 text-yellow-400 mx-auto" />
          <h1 className="text-3xl font-bold text-gray-900">
            Course Not Found
          </h1>
          <p className="text-gray-600">
            We couldn&apos;t find the course you&apos;re looking for.
          </p>
          <a
            href="/courses"
            className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Browse Courses
          </a>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<CourseLoading />}>
      <CourseClient
        initialCourseData={courseData.data}
        slug={params.slug}
      />
    </Suspense>
  );
}