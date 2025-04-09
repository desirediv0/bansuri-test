"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, MessageCircle, Pencil } from "lucide-react"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import type { Review, ReviewSectionProps } from "@/type"
import { useAuth } from "@/helper/AuthContext"
import axios from "axios"

export const ReviewSection = ({ courseId, isEnrolled, hasPurchased, userId }: ReviewSectionProps) => {
    const [reviews, setReviews] = useState<Review[]>([])
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [userReview, setUserReview] = useState<Review | null>(null)
    const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [isEditMode, setIsEditMode] = useState(false)
    const { checkAuth } = useAuth()
    const api = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL,
        withCredentials: true,
        headers: {
            "Content-Type": "application/json",
        },
    })

    api.interceptors.request.use((config) => {
        return config
    })

    const maskEmail = (email: string) => {
        const [name, domain] = email.split("@")
        return `${name.charAt(0)}${"*".repeat(name.length - 2)}${name.charAt(name.length - 1)}@${domain}`
    }

    const fetchReviews = async () => {
        try {
            const { data } = await api.get(`/review/course/${courseId}`)
            setReviews(data.data)
        } catch (error) {
            console.error("Error fetching reviews:", error)
            toast.error("Failed to load reviews")
        }
    }

    useEffect(() => {
        fetchReviews()
    }, [courseId]) // Added 'api' to dependencies

    const averageRating = reviews.length
        ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
        : "0.0"

    const handleSubmitReview = async () => {
        if (!rating) {
            toast.error("Please select a rating")
            return
        }
        const isAuthenticated = await checkAuth()
        if (!isAuthenticated) {
            toast.error("Please login to submit a review")
            return
        }

        setIsSubmitting(true)
        try {
            const { data } = await api.post("/review/create", {
                courseId,
                rating,
                comment,
            })

            if (data.success) {
                setReviews((prev) => [...prev, data.data])
                setUserReview(data.data)
                setComment("")
                setRating(0)
                setIsWriteReviewOpen(false)
                toast.success("Review submitted successfully")
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to submit review")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditReview = async () => {
        if (!rating) {
            toast.error("Please select a rating")
            return
        }
        const isAuthenticated = await checkAuth()
        if (!isAuthenticated) {
            toast.error("Please login to update your review")
            return
        }

        setIsSubmitting(true)
        try {
            const { data } = await api.put(`/review/update/${userReview?.id}`, {
                rating,
                comment,
            })

            if (data.success) {
                setReviews((prev) => prev.map((review) => (review.id === userReview?.id ? data.data : review)))
                setUserReview(data.data)
                setComment("")
                setRating(0)
                setIsWriteReviewOpen(false)
                setIsEditMode(false)
                toast.success("Review updated successfully")
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to update review")
        } finally {
            setIsSubmitting(false)
        }
    }

    // const handleDeleteReview = async (reviewId: string) => {
    //     if (!confirm("Are you sure you want to delete this review?")) return
    //     const isAuthenticated = await checkAuth();
    //     if (!isAuthenticated) {
    //         toast.error("Please login to delete your review")
    //         return false
    //     }

    //     try {
    //         const { data } = await api.delete(`/review/delete/${reviewId}`)

    //         if (data.success) {
    //             setReviews(prev => prev.filter(review => review.id !== reviewId))
    //             setUserReview(null)
    //             toast.success("Review deleted successfully")
    //         }
    //     } catch (error: any) {
    //         toast.error(error?.response?.data?.message || "Failed to delete review")
    //     }
    // }

    const canReview = (isEnrolled || hasPurchased) && !userReview

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h2 className="text-3xl font-bold text-red-600">Course Reviews</h2>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                            <Star className="w-8 h-8 fill-yellow-500 text-yellow-500" />
                            <span className="text-2xl font-bold text-black">{averageRating}</span>
                            <span className="text-gray-500 text-lg">/ 5.0</span>
                        </div>
                        <div className="text-gray-700 text-lg">
                            <span className="font-bold">{reviews.length}</span> reviews
                        </div>
                    </div>
                </div>

                {canReview && (
                    <Button
                        onClick={() => setIsWriteReviewOpen(true)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full"
                    >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Write a Review
                    </Button>
                )}
            </motion.div>

            <Dialog open={isWriteReviewOpen} onOpenChange={setIsWriteReviewOpen}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-red-600">
                            {isEditMode ? "Edit Your Review" : "Write Your Review"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 p-4">
                        <div className="flex gap-2 justify-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <motion.button
                                    key={star}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="relative"
                                >
                                    <Star
                                        className={`w-10 h-10 ${star <= (hoveredRating || rating) ? "fill-yellow-500 text-yellow-500" : "text-gray-300"
                                            }`}
                                    />
                                </motion.button>
                            ))}
                        </div>
                        <Textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience with this course..."
                            className="min-h-[120px] border-red-300 focus:border-red-500 focus:ring-red-500"
                        />
                        <Button
                            onClick={isEditMode ? handleEditReview : handleSubmitReview}
                            disabled={isSubmitting}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-full"
                        >
                            {isSubmitting ? "Submitting..." : isEditMode ? "Update Review" : "Submit Review"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <ScrollArea className="h-[600px] pr-4">
                <motion.div
                    className="grid grid-cols-1 gap-4"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: {
                            transition: {
                                staggerChildren: 0.1,
                            },
                        },
                    }}
                >
                    <AnimatePresence>
                        {reviews.map((review, index) => (
                            <motion.div
                                key={review.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="hover:shadow-lg transition-shadow bg-white">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-xl text-red-600">{review.user.name}</h3>
                                                <p className="text-sm text-gray-500">{maskEmail(review.user.email)}</p>
                                                <div className="flex gap-1">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-5 h-5 ${i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-sm font-medium text-gray-600">
                                                {new Date(review.createdAt).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                                {review.isEdited && <span className="ml-2 text-xs italic">(edited)</span>}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                                    </CardContent>
                                    {review.user.id === userId && (
                                        <CardFooter className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setRating(review.rating)
                                                    setComment(review.comment || "")
                                                    setIsEditMode(true)
                                                    setIsWriteReviewOpen(true)
                                                    setUserReview(review)
                                                }}
                                            >
                                                <Pencil className="w-4 h-4 mr-2" /> Edit
                                            </Button>
                                        </CardFooter>
                                    )}
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            </ScrollArea>
        </div>
    )
}

export default ReviewSection

