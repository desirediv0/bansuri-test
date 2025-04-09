import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="w-full p-4 bg-white shadow-md">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="w-full aspect-video" />
        </div>
      </div>
      <div className="flex flex-col md:flex-row flex-1 p-4 space-y-4 md:space-y-0 md:space-x-4 max-w-6xl mx-auto w-full">
        <Card className="flex-1 md:w-1/3">
          <CardHeader>
            <Skeleton className="h-6 w-2/3" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1 md:w-2/3">
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-4/6 mb-4" />
            <Skeleton className="h-10 w-40 mb-4" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
