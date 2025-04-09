"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Search, ChevronRight, ChevronLeft } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import axios from "axios"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { useCustomDebounce } from "@/hooks/useCustomDebounce"

interface Review {
    id: string
    rating: number
    comment: string
    isEdited: boolean
    createdAt: string
    updatedAt: string
    userId: string
    courseId: string
    user: {
        id: string
        name: string
        email: string
    }
    course: {
        title: string
        slug: string
    }
}

interface PaginationData {
    total: number
    pages: number
    page: number
    limit: number
}

export default function AdminReviews() {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        pages: 0,
        page: 1,
        limit: 10,
    })
    const [search, setSearch] = useState("")
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editReview, setEditReview] = useState<Review | null>(null)
    const [editRating, setEditRating] = useState(0)
    const [editComment, setEditComment] = useState("")
    const debouncedSearch = useCustomDebounce(search, 500)
    const [error, setError] = useState<string | null>(null)
    const [deleteDialog, setDeleteDialog] = useState(false)
    const [deleteId, setDeleteId] = useState<string>("")
    const isInitialMount = useRef(true)

    const api = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL,
        withCredentials: true,
    })

    const fetchReviews = async () => {
        try {
            setLoading(true)
            setError(null)
            const { data } = await api.get(`/review/admin/all?page=${pagination.page}&search=${debouncedSearch}`)

            if (data?.success) {
                setReviews(data.data.reviews)
                setPagination(data.data.pagination)
            } else {
                throw new Error("Failed to fetch reviews")
            }
        } catch (error: any) {
            setError(error?.response?.data?.message || "Failed to fetch reviews")
            toast.error(error?.response?.data?.message || "Failed to fetch reviews")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false
            fetchReviews()
            return
        }

        const timer = setTimeout(() => {
            fetchReviews()
        }, 100)

        return () => clearTimeout(timer)
    }, [pagination.page, debouncedSearch])

    const handleUpdateReview = async () => {
        if (!editReview) return

        try {
            const { data } = await api.put(`/review/update/${editReview.id}`, {
                rating: editRating,
                comment: editComment,
            })

            setReviews((prev) => prev.map((review) => (review.id === editReview.id ? data.data : review)))
            setIsEditModalOpen(false)
            toast.success("Review updated successfully")
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to update review")
        }
    }

    const confirmDelete = (id: string) => {
        setDeleteId(id)
        setDeleteDialog(true)
    }

    const handleDeleteConfirm = async () => {
        try {
            await api.delete(`/review/delete/${deleteId}`)
            setReviews((prev) => prev.filter((review) => review.id !== deleteId))
            toast.success("Review deleted successfully")
            setDeleteDialog(false)
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to delete review")
        }
    }


    const TruncatedText = ({ text, maxLength = 50 }: { text: string, maxLength?: number }) => {
        if (!text) return null;
        const truncated = text.length > maxLength ? text.slice(0, maxLength) + '...' : text;

        return (
            <div className="group relative">
                <div className="max-w-[200px] truncate">
                    {truncated}
                </div>
                {text.length > maxLength && (
                    <div className="absolute z-50 invisible group-hover:visible bg-black text-white p-2 rounded-md text-sm -top-8 left-0 w-max max-w-[300px] break-words">
                        {text}
                    </div>
                )}
            </div>
        );
    };

    const TableSkeleton = () => (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
                </div>
            ))}
        </div>
    )

    if (error) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-500">{error}</p>
                <Button onClick={fetchReviews} className="mt-4" variant="outline">
                    Try Again
                </Button>
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Review Management</h1>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search reviews..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>
            </div>
            {loading ? (
                <TableSkeleton />
            ) : (
                <>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Course</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead>Comment</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reviews.map((review) => (
                                    <TableRow key={review.id}>
                                        <TableCell>
                                            <TruncatedText text={review.course?.title || "N/A"} maxLength={30} />
                                        </TableCell>
                                        <TableCell>{review.user?.name || "N/A"}</TableCell>
                                        <TableCell>{review.user?.email || "N/A"}</TableCell>
                                        <TableCell>{review.rating}</TableCell>
                                        <TableCell>
                                            <TruncatedText text={review.comment || "No comment"} maxLength={50} />
                                        </TableCell>
                                        <TableCell>
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditReview(review)
                                                        setEditRating(review.rating)
                                                        setEditComment(review.comment)
                                                        setIsEditModalOpen(true)
                                                    }}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => confirmDelete(review.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-sm">
                            Page {pagination.page} of {pagination.pages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page === pagination.pages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                </>
            )}


            {/* Edit Dialog */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Review</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Rating</label>
                            <Input
                                type="number"
                                min={1}
                                max={5}
                                value={editRating}
                                onChange={(e) => setEditRating(Number(e.target.value))}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Comment</label>
                            <Textarea value={editComment} onChange={(e) => setEditComment(e.target.value)} />
                        </div>
                        <Button onClick={handleUpdateReview} className="w-full">
                            Update Review
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                    </DialogHeader>
                    <div className="py-3">
                        <p>Are you sure you want to delete this review? This action cannot be undone.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>


    )
}

