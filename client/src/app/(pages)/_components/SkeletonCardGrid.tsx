import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";

const SkeletonCard = () => {
    return (
        <Card className="flex flex-col h-full bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="p-0">
                <Skeleton className="bg-gray-300 w-full h-40 object-cover rounded-t-lg" />
            </CardHeader>
            <CardContent className="flex-grow p-4">
                <Skeleton className="bg-gray-300 h-6 w-3/4 mb-2" />
                <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Skeleton className="bg-gray-300 h-4 w-4 mr-1" />
                    <Skeleton className="bg-gray-300 h-4 w-1/4" />
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Skeleton className="bg-gray-300 h-4 w-4 mr-1" />
                    <Skeleton className="bg-gray-300 h-4 w-1/4" />
                </div>
                <div className="flex items-center text-sm text-gray-600">
                    <Skeleton className="bg-gray-300 h-4 w-4 mr-1" />
                    <Skeleton className="bg-gray-300 h-4 w-1/4" />
                </div>
            </CardContent>
            <CardFooter className="px-3 py-2 bg-gray-50 rounded-b-lg">
                <div className="flex items-center justify-between w-full">
                    <Skeleton className="bg-gray-300 h-4 w-16 rounded-md" />

                    <Skeleton className="bg-gray-300 h-10 w-28" />
                </div>
            </CardFooter>
        </Card>
    );
};

const SkeletonCardGrid = () => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 container mx-auto max-w-7xl px-4 py-8">
            {Array.from({ length: 8 }).map((_, index) => (
                <SkeletonCard key={index} />
            ))}
        </div>
    );
};

export default SkeletonCardGrid;
