"use client";

import { DynamicTable } from "../_components/DynamicTable";

export default function DraftChaptersPage() {
  const columns = [
    { key: "title", label: "Title" },
    { key: "description", label: "Description" },
    { key: "position", label: "Position" },
    { key: "isFree", label: "Free" },
  ];

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-5">Draft Chapters</h1>
      <DynamicTable
        columns={columns}
        apiUrl="/chapter/draft-chapter"
        editUrl="/chapters/edit"
        hideCourse={true}
        editChapter="/chapters/edit"
      />
    </div>
  );
}
