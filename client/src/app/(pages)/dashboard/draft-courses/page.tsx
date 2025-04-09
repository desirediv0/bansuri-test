"use client";

import { DynamicTable } from "../_components/DynamicTable";

export default function DraftCoursesPage() {
  const columns = [
    { key: "title", label: "Title" },
    { key: "slug", label: "Slug" },
    { key: "price", label: "Price" },
  ];

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-5">Draft Courses</h1>
      <DynamicTable
        columns={columns}
        apiUrl="/course/draft-course"
        editUrl="/courses/edit"
        editChapter="/courses/edit"
      />
    </div>
  );
}
