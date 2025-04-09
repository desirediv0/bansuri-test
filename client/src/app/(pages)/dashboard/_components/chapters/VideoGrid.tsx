import React from "react";
import ReactPlayer from "react-player";
import { PlayCircle } from "lucide-react";
import { ChapterDataNew } from "@/type";

interface VideoGridProps {
  chapters: ChapterDataNew[];
  isLoading: boolean;
}

export function VideoGrid({ chapters, isLoading }: VideoGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-[200px] bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">No videos available</div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {chapters.map((chapter) => (
        <div
          key={chapter.id}
          className="rounded-lg border border-gray-200 overflow-hidden shadow-sm transition-all hover:shadow-md"
        >
          <div className="aspect-video relative">
            <ReactPlayer
              url={chapter.videoUrl}
              width="100%"
              height="100%"
              controls={true}
              light={true}
              playIcon={
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/40 transition-colors">
                  <PlayCircle className="h-12 w-12 text-white" />
                </div>
              }
            />
          </div>
          <div className="p-3">
            <h3 className="font-medium text-sm line-clamp-1">
              {chapter.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {truncateDescription(chapter.description, 100)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function truncateDescription(description: string, maxLength: number) {
  if (description.length <= maxLength) return description;
  return `${description.substring(0, maxLength)}...`;
}
