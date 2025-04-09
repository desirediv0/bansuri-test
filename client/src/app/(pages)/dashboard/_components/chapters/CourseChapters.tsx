"use client"

import React, { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Loader2,
  Plus,
  FileText,
  Video,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  GripVertical,
  Pencil,
  Trash2,
  Music,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { useAuth } from "@/helper/AuthContext"
import type { DragEndEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"

import type { ChapterDataNew } from "@/type"
import { ChapterForm } from "./ChapterForm"
import ReactPlayer from "react-player"

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface ApiResponse {
  statusCode: number
  data: string
  message: ChapterDataNew[]
  success: boolean
}

interface CourseChaptersProps {
  sectionSlug: string
}

interface ChapterListProps {
  chapters: ChapterDataNew[]
  onEdit: (chapter: ChapterDataNew) => void
  onDelete: (slug: string) => void
  onToggle: (slug: string, field: "isPublished" | "isFree") => void
  onDragEnd: (event: DragEndEvent) => void
}

const SortableChapterItem = ({ chapter, index, onEdit, onDelete, onToggle }:
  { chapter: ChapterDataNew, index: number, onEdit: (chapter: ChapterDataNew) => void, onDelete: (slug: string) => void, onToggle: (slug: string, field: "isPublished" | "isFree") => void }
) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: chapter.id.toString(),
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <React.Fragment>
      {index > 0 && <Separator />}
      <div ref={setNodeRef} style={style} {...attributes} className="flex items-center p-3 md:p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div {...listeners} className="cursor-grab">
            <GripVertical className="h-5 w-5 text-muted-foreground hidden sm:block" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <h3 className="font-medium truncate">{chapter.title}</h3>
              <div className="flex flex-wrap gap-1">
                <Badge variant={chapter.isPublished ? "default" : "outline"} className="text-xs">
                  {chapter.isPublished ? "Published" : "Draft"}
                </Badge>
                <Badge variant={chapter.isFree ? "secondary" : "outline"} className="text-xs">
                  {chapter.isFree ? "Free" : "Premium"}
                </Badge>
              </div>
            </div>
            <p className="text-muted-foreground text-sm truncate mt-1">{chapter.description || "No description"}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggle(chapter.slug, "isFree")}
            title={chapter.isFree ? "Make Premium" : "Make Free"}
          >
            {chapter.isFree ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggle(chapter.slug, "isPublished")}
            title={chapter.isPublished ? "Unpublish" : "Publish"}
          >
            {chapter.isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <span className="sr-only">Open menu</span>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                >
                  <path
                    d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(chapter)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(chapter.slug)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </React.Fragment>
  )
}

const ChapterList: React.FC<ChapterListProps> = ({ chapters, onEdit, onDelete, onToggle, onDragEnd }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={chapters.map(ch => ch.id.toString())} strategy={verticalListSortingStrategy}>
        <div className="rounded-md border">
          {chapters.map((chapter, index) => (
            <SortableChapterItem
              key={chapter.id}
              chapter={chapter}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export default function CourseChapters({ sectionSlug }: CourseChaptersProps) {
  const [chapters, setChapters] = useState<ChapterDataNew[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingChapter, setEditingChapter] = useState<ChapterDataNew | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("chapters")

  const router = useRouter()
  const { checkAuth } = useAuth()

  useEffect(() => {
    fetchCourse()
  }, [sectionSlug])

  const fetchCourse = async () => {
    const isAuth = await checkAuth()
    if (!isAuth) {
      setIsLoading(false)
      router.push("/auth")
      return
    }
    try {
      const response = await axios.get<ApiResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/chapter/get-all-chapter-by-section-slug/${sectionSlug}`,
      )
      setChapters(response.data.message)
    } catch (error) {
      console.error("Error fetching course:", error)
      toast.error("Failed to load course")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (chapter: ChapterDataNew) => {
    setEditingChapter(chapter)
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (slug: string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/chapter/${slug}`)
      toast.success("Chapter deleted successfully")
      fetchCourse()
    } catch (error) {
      console.error("Error deleting chapter:", error)
      toast.error("Failed to delete chapter")
    }
  }

  const handleToggle = async (slug: string, field: "isPublished" | "isFree") => {
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/chapter/${slug}/${field === "isPublished" ? "publish" : "free"}`,
      )
      toast.success(`Chapter ${field === "isPublished" ? "publication" : "access"} status updated`)
      fetchCourse()
    } catch (error) {
      console.error(`Error toggling chapter ${field}:`, error)
      toast.error(`Failed to update chapter ${field === "isPublished" ? "publication" : "access"} status`)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = chapters.findIndex((ch) => ch.id?.toString() === active.id)
    const newIndex = chapters.findIndex((ch) => ch.id?.toString() === over.id)

    const reorderedChapters = arrayMove(chapters, oldIndex, newIndex).map((ch, index) => ({
      ...ch,
      position: index + 1,
    }))

    setChapters(reorderedChapters)

    try {
      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/chapter/reorder/${sectionSlug}`, {
        chapters: reorderedChapters.map((ch) => ({
          id: ch.id,
          position: ch.position,
        })),
      })

      if (response.data.success) {
        setChapters(response.data.message)
      }
    } catch (error) {
      console.error("Error updating chapter order:", error)
      toast.error("Failed to update chapter order")
      fetchCourse()
    }
  }

  const handleCreate = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      const response = await axios.post<ApiResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/chapter/create/${sectionSlug}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      )
      toast.success("Chapter created successfully")
      fetchCourse()
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error("Error creating chapter:", error)
      toast.error("Failed to create chapter")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      if (!editingChapter?.slug) throw new Error("Chapter slug is missing")

      const response = await axios.put<ApiResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/chapter/${editingChapter.slug}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      )

      toast.success("Chapter updated successfully")
      fetchCourse()
      setIsEditDialogOpen(false)
      setEditingChapter(null)
    } catch (error) {
      console.error("Error updating chapter:", error)
      toast.error("Failed to update chapter")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Course Content</h1>
          <p className="text-muted-foreground mt-1">Manage your course chapters and content</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Add Chapter
        </Button>
      </div>

      <Tabs defaultValue="chapters" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="chapters">Chapters List</TabsTrigger>
          <TabsTrigger value="videos" disabled={chapters.length === 0}>
            Video Gallery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chapters" className="mt-0">
          <Card className="shadow-sm border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5" /> Course Chapters
              </CardTitle>
              <CardDescription>Drag and drop to reorder chapters. Click on a chapter to edit.</CardDescription>
            </CardHeader>
            <CardContent>
              {chapters.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="text-lg font-medium mb-2">No chapters yet</h3>
                  <p className="text-muted-foreground mb-4">Get started by adding your first chapter</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline" className="mx-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add First Chapter
                  </Button>
                </div>
              ) : (
                <ChapterList
                  chapters={chapters}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                  onDragEnd={handleDragEnd}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="videos" className="mt-0">
          <Card className="shadow-sm border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Video className="h-5 w-5" /> Chapter Videos
              </CardTitle>
              <CardDescription>Preview all videos from your course chapters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {chapters.map((chapter) => (
                  <Card key={chapter.id} className="overflow-hidden border-border/40">
                    <div className="aspect-video bg-muted relative">
                      {chapter.videoUrl ? (

                        <ReactPlayer
                          url={chapter.videoUrl}
                          controls
                          width="100%"
                          height="100%"
                          className="w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Video className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                      {chapter.isFree && <Badge className="absolute top-2 right-2">Free</Badge>}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium line-clamp-1">{chapter.title}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
                        {chapter.description || "No description"}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        {chapter.pdfUrl && chapter.pdfUrl !== "null" && (
                          <Badge variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" /> PDF
                          </Badge>
                        )}
                        {chapter.audioUrl && chapter.audioUrl !== "null" && (
                          <Badge variant="outline" className="text-xs">
                            <Music className="h-3 w-3 mr-1" /> Audio
                          </Badge>
                        )}
                        <Badge variant={chapter.isPublished ? "default" : "outline"} className="text-xs ml-auto">
                          {chapter.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px] md:max-w-[650px] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl md:text-2xl font-bold">Edit Chapter</DialogTitle>
            <DialogDescription>Update your chapter details and content</DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4">
            <ChapterForm chapter={editingChapter} onSubmit={handleUpdate} isSubmitting={isSubmitting} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[550px] md:max-w-[650px] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl md:text-2xl font-bold">Create New Chapter</DialogTitle>
            <DialogDescription>Add a new chapter to your course</DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4">
            <ChapterForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

