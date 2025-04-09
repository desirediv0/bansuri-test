"use client";

import { useSearchParams } from "next/navigation";

export function CourseParams({
  children,
}: {
  children: (slugs: string[]) => React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const courseSlugs = searchParams.getAll("course-slug");
  return <>{children(courseSlugs)}</>;
}
