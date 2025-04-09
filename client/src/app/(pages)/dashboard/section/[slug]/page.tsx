"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  BookOpen,
  Trash,
  CheckCircle,
  XCircle,
  GripVertical,
  MoreVertical,
  PlusCircle,
  Book,
  Pencil,
} from "lucide-react";
import { Chapter } from "@/type";
import { useAuth } from "@/helper/AuthContext";
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ToggleSwitch } from "../../_components/ToggleSwitch";

interface FormValues {
  title: string;
  isPublished: boolean;
  isFree: boolean;
}

interface Section {
  id: string;
  title: string;
  slug: string;
  position: number;
  isPublished: boolean;
  chapters: Chapter[];
  isEditing?: boolean;
}

const SortableRow = ({
  section,
  onPublishToggle,
  onDelete,
  onUpdate,
  deletingId,
  router,
}: {
  section: Section;
  onPublishToggle: (slug: string) => void;
  onDelete: (slug: string) => void;
  onUpdate: (slug: string, title: string) => Promise<void>;
  deletingId: string | null;
  router: ReturnType<typeof useRouter>;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const [isUpdating, setIsUpdating] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);


  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleUpdate = async () => {
    if (editTitle.trim() === "") return;
    if (editTitle === section.title) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate(section.slug, editTitle);
      setIsEditing(false);
    } catch {
      setEditTitle(section.title);
    } finally {
      setIsUpdating(false);
    }
  };
  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <button
          className="cursor-grab focus:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>
      </TableCell>
      <TableCell>{section.position}</TableCell>
      <TableCell className="font-medium">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdate();
                if (e.key === "Escape") {
                  setEditTitle(section.title);
                  setIsEditing(false);
                }
              }}
              autoFocus
            />{" "}
            <Button onClick={handleUpdate} size="sm" disabled={isUpdating}>
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
            <Button
              onClick={() => {
                setEditTitle(section.title);
                setIsEditing(false);
              }}
              variant="ghost"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div
            className="flex items-center gap-2"
            onDoubleClick={() => setIsEditing(true)}
          >
            {section.title}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
      </TableCell>
      <TableCell>
        <Button
          onClick={() => onPublishToggle(section.slug)}
          variant={section.isPublished ? "default" : "secondary"}
          size="sm"
          className="flex items-center gap-2"
        >
          {section.isPublished ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Published
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              Draft
            </>
          )}
        </Button>
      </TableCell>
      <TableCell>
        <span className="font-medium">{section.chapters.length}</span> chapters
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Chapters
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/dashboard/create-course/${section.slug}`)
                }
                className="flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Create Chapters
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/dashboard/chapter/${section.slug}`)
                }
                className="flex items-center gap-2"
              >
                <Book className="h-4 w-4" />
                View Chapters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => onDelete(section.slug)}
            size="sm"
            variant="destructive"
            disabled={deletingId === section.slug}
          >
            {deletingId === section.slug ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash className="h-4 w-4" />
            )}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const SectionPage = () => {
  const params = useParams();
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { checkAuth } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      title: "",
      isPublished: false,
      isFree: false,
    },
  });

  useEffect(() => {
    const initPage = async () => {
      await checkAuth();
      fetchSections();
    };
    initPage();
  }, [params.slug]);

  const fetchSections = async () => {
    if (!params.slug) return;

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/section/get/${params.slug}`
      );

      const sectionsData = response.data.data || [];

      if (Array.isArray(sectionsData)) {
        setSections(sectionsData);
      } else {
        setSections([]);
      }

    } catch (error) {
      console.error("Error fetching sections:", error);
      toast.error("Failed to fetch sections");
      setSections([]);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/section/create/${params.slug}`,
        data
      );
      toast.success("Section created!");
      reset();
      fetchSections();
    } catch {
      toast.error("Failed to create section");
    } finally {
      reset();
    }
  };

  const handlePublishToggle = async (sectionSlug: string) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/section/toggle-publish/${sectionSlug}`,
        {}
      );
      fetchSections();
      toast.success("Section status updated");
    } catch (error) {
      console.error("Error toggling section status:", error);
      toast.error("Failed to update section status");
    }
  };

  const handleDelete = async (sectionSlug: string) => {
    try {
      setDeletingId(sectionSlug);
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/section/delete/${sectionSlug}`
      );
      toast.success("Section deleted successfully");
      fetchSections();
    } catch (error) {
      console.error("Error deleting section:", error);
      toast.error("Failed to delete section");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const reorderedSections = arrayMove(sections, oldIndex, newIndex).map(
        (section, index) => ({
          ...section,
          position: index + 1,
        })
      );

      setSections(reorderedSections);

      try {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/section/reorder/${params.slug}`,
          {
            sections: reorderedSections.map((s) => ({
              id: s.id,
              position: s.position,
            })),
          }
        );

      } catch (error) {
        console.error("Error reordering sections:", error);
        toast.error("Failed to reorder sections");
        fetchSections();
      }
    }
  };

  const handleUpdate = async (sectionSlug: string, title: string) => {
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/section/update/${sectionSlug}`,
        { title },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.success) {
        setSections(
          sections.map((section) =>
            section.slug === sectionSlug
              ? { ...section, title: response.data.message.title }
              : section
          )
        );
        toast.success("Section updated successfully");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Please login to continue");
        router.push("/auth");
        return;
      }
      console.error("Error updating section:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Failed to update section"
        );
      } else {
        toast.error("Failed to update section");
      }
      throw error;
    }
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-8">
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gray-50 rounded-t-lg">
          <CardTitle className="text-xl font-semibold text-gray-800">
            Create New Section
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title">Section Title</Label>
              <Input
                {...register("title", { required: "Title is required" })}
                placeholder="Enter section title"
              />
              {errors.title && (
                <span className="text-red-500">{errors.title.message}</span>
              )}
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Controller
                  name="isPublished"
                  control={control}
                  render={({ field }) => (
                    <ToggleSwitch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      label="Published"
                      activeColor="bg-green-500"
                      activeIcon={<CheckCircle className="w-4 h-4" />}
                      inactiveIcon={<XCircle className="w-4 h-4" />}
                    />
                  )}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Controller
                  name="isFree"
                  control={control}
                  render={({ field }) => (
                    <ToggleSwitch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      label="Free Access"
                      activeColor="bg-blue-500"
                      activeIcon={<CheckCircle className="w-4 h-4" />}
                      inactiveIcon={<XCircle className="w-4 h-4" />}
                    />
                  )}
                />
              </div>
            </div>

            <Button type="submit">Create Section</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gray-50 rounded-t-lg">
          <CardTitle className="text-xl font-semibold text-gray-800">
            Course Sections
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead></TableHead>
                <TableHead className="font-semibold">Position</TableHead>
                <TableHead className="font-semibold">Title</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Chapters</TableHead>
                <TableHead className="text-right font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={(sections || []).map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <TableBody>
                  {(sections || []).length > 0 ? (
                    sections.map((section) => (
                      <SortableRow
                        key={section.id}
                        section={section}
                        onPublishToggle={handlePublishToggle}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                        deletingId={deletingId}
                        router={router}
                      />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No sections found. Create your first section above.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </SortableContext>
            </DndContext>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SectionPage;
