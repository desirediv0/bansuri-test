import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, GripVertical } from "lucide-react";
import { ChapterDataNew } from "@/type";

interface SortableChapterRowProps {
  chapter: ChapterDataNew;
  onEdit: (chapter: ChapterDataNew) => void;
  onDelete: (slug: string) => void;
  onToggle: (slug: string, field: "isPublished" | "isFree") => void;
}

export function SortableChapterRow({
  chapter,
  onEdit,
  onDelete,
  onToggle,
}: SortableChapterRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: chapter.id || "" });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow ref={setNodeRef} style={style} {...attributes}>
      <TableCell>
        <GripVertical className="cursor-move" {...listeners} />
      </TableCell>
      <TableCell>{chapter.title}</TableCell>
      <TableCell className="hidden md:table-cell">
        {truncateDescription(chapter.description, 50)}
      </TableCell>
      <TableCell>
        <Switch
          checked={chapter.isFree}
          onCheckedChange={() => onToggle(chapter.slug, "isFree")}
        />
      </TableCell>
      <TableCell>
        <Switch
          checked={chapter.isPublished}
          onCheckedChange={() => onToggle(chapter.slug, "isPublished")}
        />
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={() => onEdit(chapter)}>
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  chapter.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(chapter.slug)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

function truncateDescription(description: string, maxLength: number) {
  if (description.length <= maxLength) return description;
  return `${description.substring(0, maxLength)}...`;
}
