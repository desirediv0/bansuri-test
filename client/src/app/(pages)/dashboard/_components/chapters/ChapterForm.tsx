"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Loader2, FileText, Music, ExternalLink } from "lucide-react"
import type { ChapterDataNew } from "@/type"
import FileUpload from "./FileUpload"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

// Base URL for Digital Ocean Spaces
const STORAGE_BASE_URL = "https://desirediv-storage.blr1.digitaloceanspaces.com"

interface ChapterFormProps {
  chapter?: ChapterDataNew | null
  onSubmit: (data: any) => Promise<void>
  isSubmitting: boolean
}

export function ChapterForm({ chapter, onSubmit, isSubmitting }: ChapterFormProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [removePdf, setRemovePdf] = useState(false)
  const [removeAudio, setRemoveAudio] = useState(false)

  // Track if we have existing files - check for both null and "null" string
  const [hasPdfFile, setHasPdfFile] = useState<boolean>(!!(chapter?.pdfUrl && chapter?.pdfUrl !== "null"))
  const [hasAudioFile, setHasAudioFile] = useState<boolean>(!!(chapter?.audioUrl && chapter?.audioUrl !== "null"))

  // Helper function to get full URL
  const getFullUrl = (path: string | null | undefined) => {
    if (!path || path === "null") return null

    // If the path already includes the base URL, return it as is
    if (path.startsWith("http")) return path

    // Otherwise, prepend the base URL
    return `${STORAGE_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`
  }

  const getFileName = (url: string | null | undefined) => {
    if (!url || url === "null") return ""
    return url.split("/").pop() || ""
  }

  // Get full URLs for PDF and audio
  const pdfFullUrl = chapter?.pdfUrl ? getFullUrl(chapter.pdfUrl) : null
  const audioFullUrl = chapter?.audioUrl ? getFullUrl(chapter.audioUrl) : null

  // Function to verify URL validity
  const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url) return false
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }

  // Verify if URLs are valid
  const validPdfUrl = pdfFullUrl && isValidUrl(pdfFullUrl) ? pdfFullUrl : null
  const validAudioUrl = audioFullUrl && isValidUrl(audioFullUrl) ? audioFullUrl : null

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      title: chapter?.title || "",
      description: chapter?.description || "",
      videoUrl: chapter?.videoUrl || "",
      isFree: chapter?.isFree || false,
      isPublished: chapter?.isPublished || false,
    },
  })

  const isFree = watch("isFree")
  const isPublished = watch("isPublished")

  useEffect(() => {
    // Update file state when chapter changes
    if (chapter) {
      setHasPdfFile(!!(chapter.pdfUrl && chapter.pdfUrl !== "null"))
      setHasAudioFile(!!(chapter.audioUrl && chapter.audioUrl !== "null"))
      setRemovePdf(false)
      setRemoveAudio(false)
    }
  }, [chapter])

  const handleFormSubmit = async (data: any) => {
    // Create FormData for file uploads
    const formData = new FormData()
    formData.append("title", data.title)
    formData.append("description", data.description)
    formData.append("videoUrl", data.videoUrl || "")
    formData.append("isFree", data.isFree ? "true" : "false")
    formData.append("isPublished", data.isPublished ? "true" : "false")

    // Handle PDF file
    if (pdfFile) {
      formData.append("pdf", pdfFile)
    } else if (removePdf) {
      formData.append("pdfUrl", "null")
    } else if (chapter?.pdfUrl && hasPdfFile) {
      formData.append("pdfUrl", chapter.pdfUrl)
    }

    // Handle Audio file
    if (audioFile) {
      formData.append("audio", audioFile)
    } else if (removeAudio) {
      formData.append("audioUrl", "null")
    } else if (chapter?.audioUrl && hasAudioFile) {
      formData.append("audioUrl", chapter.audioUrl)
    }

    await onSubmit(formData)
  }

  return (
    <ScrollArea className="max-h-[80vh]">
      <Card className="border-0 shadow-none">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title" className="font-medium">
                Title
              </Label>
              <Input
                id="title"
                placeholder="Enter chapter title"
                className="w-full"
                {...register("title", { required: "Title is required" })}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message as string}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl" className="font-medium">
                Video URL
              </Label>
              <Input
                id="videoUrl"
                placeholder="Enter YouTube or Vimeo URL"
                className="w-full"
                {...register("videoUrl", { required: "Video URL is required" })}
              />
              {errors.videoUrl && <p className="text-sm text-destructive">{errors.videoUrl.message as string}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Enter chapter description"
              className="min-h-[100px]"
              {...register("description", { required: "Description is required" })}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message as string}</p>}
          </div>

          <div className="space-y-4 grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="font-medium flex items-center gap-2">
                <FileText size={16} />
                PDF Document
              </Label>

              {chapter?.pdfUrl && chapter.pdfUrl !== "null" && hasPdfFile && (
                <div className="p-3 bg-muted/40 rounded-md mb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 max-w-[70%]">
                      <FileText size={18} className="text-blue-600 shrink-0" />
                      <span className="text-sm font-medium truncate">{getFileName(chapter.pdfUrl)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 shrink-0">
                        Existing
                      </Badge>
                      {validPdfUrl && (
                        <a
                          href={validPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 bg-white px-2 py-1 rounded border hover:bg-blue-50 transition-colors"
                        >
                          View <ExternalLink size={12} className="ml-1" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <FileUpload
                accept={{ "application/pdf": [".pdf"] }}
                value={pdfFile || (hasPdfFile && chapter?.pdfUrl !== "null" ? chapter?.pdfUrl || null : null)}
                onChange={(file) => {
                  setPdfFile(file)
                  setRemovePdf(false)
                  setHasPdfFile(true)
                }}
                onRemove={() => {
                  setPdfFile(null)
                  setRemovePdf(true)
                  setHasPdfFile(false)
                }}
                fileType="pdf"
                existingFileUrl={pdfFullUrl}
              />
            </div>

            <div className="space-y-3">
              <Label className="font-medium flex items-center gap-2">
                <Music size={16} />
                Audio File
              </Label>

              {chapter?.audioUrl && chapter.audioUrl !== "null" && hasAudioFile && (
                <div className="p-3 bg-muted/40 rounded-md mb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 max-w-full sm:max-w-[60%]">
                      <Music size={18} className="text-green-600 shrink-0" />
                      <span className="text-sm font-medium truncate">{getFileName(chapter.audioUrl)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 shrink-0">
                        Existing
                      </Badge>
                      {validAudioUrl ? (
                        <audio controls className="h-8 w-full max-w-[200px]" src={validAudioUrl}>
                          Your browser does not support the audio element.
                        </audio>
                      ) : (
                        <span className="text-xs text-red-500">Invalid audio URL</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <FileUpload
                accept={{ "audio/*": [".mp3", ".wav"] }}
                value={audioFile || (hasAudioFile && chapter?.audioUrl !== "null" ? chapter?.audioUrl || null : null)}
                onChange={(file) => {
                  setAudioFile(file)
                  setRemoveAudio(false)
                  setHasAudioFile(true)
                }}
                onRemove={() => {
                  setAudioFile(null)
                  setRemoveAudio(true)
                  setHasAudioFile(false)
                }}
                fileType="audio"
                existingFileUrl={audioFullUrl}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFree"
                checked={isFree}
                className="h-5 w-5"
                onCheckedChange={(checked) => setValue("isFree", !!checked)}
              />
              <Label htmlFor="isFree" className="font-medium">
                Free Chapter
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublished"
                checked={isPublished}
                className="h-5 w-5"
                onCheckedChange={(checked) => setValue("isPublished", !!checked)}
              />
              <Label htmlFor="isPublished" className="font-medium">
                Published
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (chapter) {
                  setValue("isPublished", false)
                }
              }}
              disabled={isSubmitting}
            >
              {chapter ? "Save as Draft" : "Cancel"}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="px-6">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {chapter ? "Updating..." : "Creating..."}
                </>
              ) : chapter ? (
                "Update Chapter"
              ) : (
                "Create Chapter"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </ScrollArea>
  )
}

