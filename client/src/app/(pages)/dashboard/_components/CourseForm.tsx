"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { useForm, type SubmitHandler, Controller } from "react-hook-form"
import { useRouter } from "next/navigation"
import axios from "axios"
import { useDropzone } from "react-dropzone"
import Image from "next/image"
import dynamic from "next/dynamic"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
} from "@/components/ui/alert-dialog"
import { Trash2, Upload, Loader2 } from "lucide-react"

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false })

import type { CourseDataNew, Category } from "@/type"
import { toast } from "@/hooks/use-toast"

const CourseForm = ({ isEditing, initialData, courseSlug, onUpdateSuccess }: {
  isEditing: boolean,
  initialData: CourseDataNew | null,
  courseSlug: string | null,
  onUpdateSuccess?: (updatedData: CourseDataNew) => void,
}) => {
  const [thumbnail, setThumbnail] = useState<File | null>(null)

  const getImageUrl = (image: string | null | undefined) => {
    if (!image) return 'https://placehold.co/600x400?text=No+Image';
    if (image.startsWith('http')) return image;
    return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
  };

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialData?.thumbnail ? getImageUrl(initialData.thumbnail) : null,
  )
  const [isLoading, setIsLoading] = useState(false)
  const [courseData, setCourseData] = useState<CourseDataNew | null>(initialData)
  const [categories, setCategories] = useState<Category[]>([])

  const router = useRouter()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CourseDataNew>({
    defaultValues: initialData || {},
    mode: "onSubmit",
  })

  const isPaid = watch("paid")

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setThumbnail(file)
      setThumbnailPreview(URL.createObjectURL(file))
    }
  }, [])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  })

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/category`)
        setCategories(response.data.data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch categories",
          variant: "destructive",
        })
      }
    }
    fetchCategories()
  }, [])

  const onSubmit: SubmitHandler<CourseDataNew> = async (data) => {
    setIsLoading(true)
    try {
      if (isEditing && courseSlug) {
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/course/update-course/${courseSlug}`,
          data,
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        )
        const updatedData = response.data.message
        setCourseData(updatedData)
        onUpdateSuccess?.(updatedData)
        toast({
          title: "Success",
          description: "Course updated successfully!",
        })
        router.push("/dashboard")
      } else {
        const formData = new FormData()
        Object.entries(data).forEach(([key, value]) => {
          if (typeof value === "boolean") {
            formData.append(key, value ? "true" : "false")
          } else if (value !== undefined && value !== null) {
            formData.append(key, value.toString())
          }
        })
        if (thumbnail) {
          formData.append("thumbnail", thumbnail)
        }
        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/course/create-course`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        if (response.data.success) {
          toast({
            title: "Success",
            description: "Course created successfully!",
          })
          router.push(`/dashboard/section/${response.data.message.slug}`)
        } else {
          throw new Error(response.data.message || "Failed to create course")
        }
      }
      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      if (axios.isAxiosError(error) && error.response) {
        toast({
          title: "Error",
          description: error.response.data?.message || "Something went wrong",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "Something went wrong",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!courseSlug) return
    setIsLoading(true)
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/course/delete-course/${courseSlug}`, {
      })
      toast({
        title: "Success",
        description: "Course deleted successfully",
      })
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      console.error("Error deleting course:", error)
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = async (property: keyof CourseDataNew) => {
    if (!courseSlug || !courseData) return
    try {
      const updatedValue = !courseData[property]
      const newData = {
        ...courseData,
        [property]: updatedValue,
      }
      setCourseData(newData)
      setValue(property, updatedValue)
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/course/toggle-course-property/${courseSlug}`,
        { property },
      )
      if (response.data.success) {
        const serverValue = response.data.data[property]
        const updatedCourseData = {
          ...courseData,
          [property]: serverValue,
        }
        setCourseData(updatedCourseData)
        setValue(property, serverValue)
        onUpdateSuccess?.(updatedCourseData)
        toast({
          title: "Success",
          description: `Course ${property} updated successfully`,
        })
      } else {
        throw new Error("Failed to update")
      }
    } catch {
      setCourseData((prev) => ({
        ...prev!,
        [property]: !courseData[property],
      }))
      setValue(property, courseData[property])
      toast({
        title: "Error",
        description: `Failed to update ${property}`,
        variant: "destructive",
      })
    }
  }

  const updateThumbnail = async () => {
    if (!thumbnail || !courseSlug) return
    setIsLoading(true)
    const formData = new FormData()
    formData.append("thumbnail", thumbnail)
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/course/update-course-image/${courseSlug}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",

          },
        },
      )
      setThumbnailPreview(getImageUrl(response.data.message.thumbnail))
      toast({
        title: "Success",
        description: "Thumbnail updated successfully",
      })
    } catch (error) {
      console.error("Error updating thumbnail:", error)
      toast({
        title: "Error",
        description: "Failed to update thumbnail",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }


  if (!courseData && isEditing) {
    return <div>Loading...</div>
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card className="shadow-lg bg-white dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-t-lg">
          <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">
            {isEditing ? "Edit Course" : "Create New Course"}
          </CardTitle>
          {isEditing && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Course
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the course and remove all associated
                    data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Course Status */}
            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex flex-col">
                <Label htmlFor="isPublished" className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  Publication Status
                </Label>
                <span className="text-sm text-gray-500">
                  {watch("isPublished") ? "Published - Visible to students" : "Draft - Not visible to students"}
                </span>
              </div>
              <Controller
                name="isPublished"
                control={control}
                render={({ field }) => (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Switch
                            checked={!!field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked)
                              if (isEditing) {
                                handleToggle("isPublished")
                              }
                            }}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {field.value
                          ? "Course is live and visible to students"
                          : "Course is not yet visible to students"
                        }
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              />
            </div>

            {/* Course Type */}
            <div className="flex items-center justify-between bg-gray-100  p-4 rounded-lg">
              <div className="flex flex-col">
                <Label htmlFor="paid" className="text-lg font-semibold text-gray-700">
                  Payment Type
                </Label>
                <span className="text-sm text-gray-500">
                  {watch("paid") ? "Premium Course (Paid Access)" : "Free Course (Open Access)"}
                </span>
              </div>
              <Controller
                name="paid"
                control={control}
                render={({ field }) => (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Switch
                            checked={!!field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked)
                              if (isEditing) {
                                handleToggle("paid")
                              }
                            }}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{field.value ? "This is a paid course" : "This is a free course"}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              />
            </div>

            <Accordion
              type="single"
              collapsible
              defaultValue="basic-info"
              className="bg-white dark:bg-gray-800 rounded-lg shadow"
            >
              {/* Basic Information */}
              <AccordionItem value="basic-info">
                <AccordionTrigger className="text-lg font-semibold px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  Basic Information
                </AccordionTrigger>
                <AccordionContent className="space-y-4 p-4">
                  {/* Title */}
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Title
                    </Label>
                    <Input
                      id="title"
                      {...register("title", { required: "Title is required" })}
                      placeholder="Course title"
                      className="mt-1"
                    />
                    {errors.title && <span className="text-red-500 text-sm">{errors.title.message}</span>}
                  </div>

                  {/* Description */}
                  <div className="flex flex-col space-y-2">
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium text-gray-700"
                    >
                      Description
                    </Label>
                    <div className="h-[400px] relative">
                      <Controller
                        name="description"
                        control={control}
                        rules={{ required: "Description is required" }}
                        render={({ field }) => (
                          <JoditEditor
                            value={field.value}
                            config={{
                              readonly: false,
                              height: 350,
                              toolbarSticky: false,
                              toolbarAdaptive: false,
                              buttons: [
                                'source', '|',
                                'bold', 'strikethrough', 'underline', 'italic', '|',
                                'superscript', 'subscript', '|',
                                'ul', 'ol', '|',
                                'outdent', 'indent', '|',
                                'font', 'fontsize', 'brush', 'paragraph', '|',
                                'image', 'video', 'table', 'link', '|',
                                'align', 'undo', 'redo', '|',
                                'hr', 'eraser', 'copyformat', '|',
                                'symbol', 'fullsize', 'print', 'about'
                              ],
                              uploader: {
                                insertImageAsBase64URI: true
                              },
                              removeButtons: [],
                              showCharsCounter: true,
                              showWordsCounter: true,
                              showXPathInStatusbar: false,
                              askBeforePasteHTML: false,
                              askBeforePasteFromWord: false,
                              defaultActionOnPaste: 'insert_clear_html',
                              width: '100%',
                              enableDragAndDropFileToEditor: true,
                              colors: {
                                greyscale: ['#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF'],
                                palette: ['#980000', '#FF0000', '#FF9900', '#FFFF00', '#00F0F0', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF'],
                                full: ['#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC',
                                  '#DD7E6B', '#EA9999', '#F9CB9C', '#FFE599', '#B6D7A8', '#A2C4C9', '#A4C2F4', '#9FC5E8', '#B4A7D6', '#D5A6BD',
                                  '#CC4125', '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6D9EEB', '#6FA8DC', '#8E7CC3', '#C27BA0',
                                  '#A61C00', '#CC0000', '#E69138', '#F1C232', '#6AA84F', '#45818E', '#3C78D8', '#3D85C6', '#674EA7', '#A64D79',
                                  '#85200C', '#990000', '#B45F06', '#BF9000', '#38761D', '#134F5C', '#1155CC', '#0B5394', '#351C75', '#741B47',
                                  '#5B0F00', '#660000', '#783F04', '#7F6000', '#274E13', '#0C343D', '#1C4587', '#073763', '#20124D', '#4C1130']
                              },
                            }}
                            onBlur={(newContent) => field.onChange(newContent)}
                          />
                        )}
                      />
                    </div>
                    {errors.description && (
                      <span className="text-red-500 text-sm mt-1">
                        {errors.description.message}
                      </span>
                    )}
                  </div>

                  {/* Price (if paid) */}
                  {isPaid && (
                    <div>
                      <Label htmlFor="price" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Regular Price (₹)
                      </Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <Input
                          id="price"
                          {...register("price", {
                            required: "Price is required for paid courses",
                            min: { value: 0.01, message: "Price must be greater than 0" },
                          })}
                          className="pl-8"
                          placeholder="499.00"
                          type="number"
                          step="0.01"
                        />
                      </div>
                      {errors.price && <span className="text-red-500 text-sm">{errors.price.message}</span>}
                    </div>
                  )}
                  {/* Sale Price (if paid) */}
                  {isPaid && (
                    <div>
                      <Label htmlFor="salePrice" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Sale Price (Optional) (₹)
                      </Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <Input
                          id="salePrice"
                          {...register("salePrice", {
                            setValueAs: (value) => (value === "" ? 0 : parseFloat(value)),
                            validate: {
                              validPrice: (value) => {
                                // Always allow zero or empty values
                                if (value === 0 || String(value) === "" || !value) return true;

                                const regularPrice = parseFloat(String(watch("price") || "0"));
                                // Only validate if sale price is greater than zero
                                return value <= regularPrice || "Sale price must be less than or equal to regular price";
                              },
                            },
                          })}
                          className="pl-8"
                          placeholder="299.00"
                          type="number"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      {errors.salePrice && <span className="text-red-500 text-sm">{errors.salePrice.message}</span>}
                    </div>
                  )}

                  {/* Language */}
                  <div>
                    <Label htmlFor="language" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Language
                    </Label>
                    <Input
                      id="language"
                      {...register("language", { required: "Language is required" })}
                      placeholder="Course language"
                      className="mt-1"
                    />
                    {errors.language && <span className="text-red-500 text-sm">{errors.language.message}</span>}
                  </div>

                  {/* Category */}
                  <div>
                    <Label htmlFor="categoryId" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Category
                    </Label>
                    <Controller
                      name="categoryId"
                      control={control}
                      rules={{ required: "Category is required" }}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.categoryId && <span className="text-red-500 text-sm">{errors.categoryId.message}</span>}
                  </div>

                  {/* Subheading */}
                  <div>
                    <Label htmlFor="subheading" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Subheading
                    </Label>
                    <Input
                      id="subheading"
                      {...register("subheading")}
                      placeholder="Course subheading"
                      className="mt-1"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* SEO Settings */}
              <AccordionItem value="seo">
                <AccordionTrigger className="text-lg font-semibold px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  SEO Settings
                </AccordionTrigger>
                <AccordionContent className="space-y-4 p-4">
                  <div>
                    <Label htmlFor="metaTitle" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Meta Title
                    </Label>
                    <Input id="metaTitle" {...register("metaTitle")} placeholder="SEO Meta title" className="mt-1" />
                  </div>

                  <div>
                    <Label htmlFor="metaDesc" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Meta Description
                    </Label>
                    <Textarea
                      id="metaDesc"
                      {...register("metaDesc")}
                      placeholder="SEO Meta description"
                      className="mt-1"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Course Settings */}
              <AccordionItem value="settings">
                <AccordionTrigger className="text-lg font-semibold px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  Course Settings
                </AccordionTrigger>
                <AccordionContent className="space-y-4 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {["featured", "popular", "trending", "bestseller"].map((type) => (
                      <div
                        key={type}
                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
                      >
                        <Label className="capitalize text-sm font-medium text-gray-700 dark:text-gray-200">
                          {type}
                        </Label>
                        <Controller
                          name={`is${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof CourseDataNew}
                          control={control}
                          render={({ field }) => (
                            <Switch
                              checked={!!field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked)
                                if (isEditing) {
                                  handleToggle(
                                    `is${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof CourseDataNew,
                                  )
                                }
                              }}
                            />
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Course Thumbnail */}
              <AccordionItem value="thumbnail">
                <AccordionTrigger className="text-lg font-semibold px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  Course Thumbnail
                </AccordionTrigger>

                <AccordionContent className="p-4">
                  <div
                    {...getRootProps()}
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-red-500 transition-colors duration-200"
                  >
                    <input {...getInputProps()} />
                    {thumbnailPreview ? (
                      <div className="space-y-4">
                        <div className="relative h-[200px] w-full">
                          <Image
                            src={thumbnailPreview}
                            alt="Thumbnail preview"
                            layout="fill"
                            objectFit="cover"
                            className="rounded-lg"
                          />
                        </div>
                        {isEditing && thumbnail && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateThumbnail();
                            }}
                            disabled={isLoading}
                            className="w-full"
                          >
                            {isLoading ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Uploading...</span>
                              </div>
                            ) : (
                              <span>Update Thumbnail</span>
                            )}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="py-8">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">
                          Drag & drop or click to select thumbnail
                        </p>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Thumbnail Video */}
              <AccordionItem value="video">
                <AccordionTrigger className="text-lg font-semibold px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  Thumbnail Video
                </AccordionTrigger>
                <AccordionContent className="p-4">
                  <div>
                    <Label htmlFor="videoUrl" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Video URL
                    </Label>
                    <Input
                      id="videoUrl"
                      {...register("videoUrl")}
                      placeholder="https://www.your-video-url.com"
                      className="mt-1"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex flex-col space-y-4">
              {Object.keys(errors).length > 0 && (
                <div
                  className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-h-40 overflow-y-auto"
                  role="alert"
                >
                  <strong className="font-bold">Please fix the following errors:</strong>
                  <ul className="mt-2 list-disc list-inside">
                    {Object.entries(errors).map(([key, error]) => (
                      <li key={key}>{error.message}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-500 hover:bg-red-600 
                text-white font-semibold py-3 px-6 rounded-lg 
                transition-all duration-300 
                disabled:opacity-70 disabled:cursor-not-allowed
                shadow-lg hover:shadow-xl active:transform 
                active:scale-[0.99] focus:outline-none 
                focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="font-medium">Please wait...</span>
                  </div>
                ) : isEditing ? (
                  "Update Course"
                ) : (
                  "Create Course"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CourseForm
