import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChapterDataNew } from "@/type";
import { SortableChapterRow } from "./SortableChapterRow";

interface ChapterListProps {
  chapters: ChapterDataNew[];
  onEdit: (chapter: ChapterDataNew) => void;
  onDelete: (slug: string) => void;
  onToggle: (slug: string, field: "isPublished" | "isFree") => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export function ChapterList({
  chapters,
  onEdit,
  onDelete,
  onToggle,
  onDragEnd,
}: ChapterListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead>Free</TableHead>
            <TableHead>Published</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <SortableContext
            items={chapters.map((chapter) => ({
              id: chapter.id?.toString() || "",
            }))}
            strategy={verticalListSortingStrategy}
          >
            {chapters.length > 0 ? (
              chapters.map((chapter) => (
                <SortableChapterRow
                  key={chapter.id}
                  chapter={chapter}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggle={onToggle}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No chapters found
                </TableCell>
              </TableRow>
            )}
          </SortableContext>
        </TableBody>
      </Table>
    </DndContext>
  );
}
