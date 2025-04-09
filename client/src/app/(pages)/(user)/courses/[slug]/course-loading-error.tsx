import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const LoadingSkeleton = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Skeleton */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800">
                <div className="container mx-auto px-4 py-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Left Column */}
                        <div className="space-y-4">
                            {/* Badges Skeleton */}
                            <div className="flex gap-2">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-6 w-20 bg-white/20" />
                                ))}
                            </div>
                            {/* Title Skeleton */}
                            <Skeleton className="h-12 w-3/4 bg-white/20" />
                            {/* Description Skeleton */}
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full bg-white/20" />
                                <Skeleton className="h-4 w-5/6 bg-white/20" />
                                <Skeleton className="h-4 w-4/6 bg-white/20" />
                            </div>
                            {/* Stats Skeleton */}
                            <div className="flex gap-4">
                                <Skeleton className="h-8 w-24 bg-white/20" />
                                <Skeleton className="h-8 w-24 bg-white/20" />
                            </div>
                        </div>
                        {/* Right Column - Video/Image Skeleton */}
                        <div>
                            <Skeleton className="aspect-video w-full bg-white/20 rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-8 w-48" />
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {[1, 2, 3].map((section) => (
                                    <div key={section} className="space-y-4">
                                        <Skeleton className="h-12 w-full" />
                                        <div className="pl-4 space-y-3">
                                            {[1, 2].map((chapter) => (
                                                <Skeleton key={chapter} className="h-16 w-full" />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="md:col-span-1">
                        <Card>
                            <CardContent className="space-y-6 p-6">
                                <Skeleton className="h-12 w-32" />
                                <Skeleton className="h-12 w-full" />
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-40" />
                                    <div className="space-y-3">
                                        {[1, 2, 3].map((item) => (
                                            <div key={item} className="flex items-center gap-2">
                                                <Skeleton className="h-5 w-5" />
                                                <Skeleton className="h-4 w-32" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ErrorComponent = ({ error }: { error: string | null }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                        Error Loading Course
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-600">
                        {error ||
                            "An unexpected error occurred while loading the course. Please try again later."}
                    </p>
                    <div className="flex gap-4">
                        <Button
                            onClick={() => window.location.reload()}
                            className="w-full"
                            variant="default"
                        >
                            Retry
                        </Button>
                        <Button
                            onClick={() => (window.location.href = "/courses")}
                            className="w-full"
                            variant="outline"
                        >
                            Back to Courses
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default {
    LoadingSkeleton,
    ErrorComponent,
};
