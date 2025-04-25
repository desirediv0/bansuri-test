"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Clock, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface ZoomSession {
  id: string;
  title: string;
  thumbnailUrl?: string;
  startTime: string;
  endTime: string;
  teacherName: string;
  zoomLink: string;
  zoomPassword: string;
  formattedDate: string;
  formattedTime: string;
}

interface Subscription {
  id: string;
  zoomSession: ZoomSession;
  status: string;
}

const MyClasses = () => {
  const [classes, setClasses] = useState<ZoomSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMyClasses();
  }, []);

  const fetchMyClasses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/my-subscriptions`,
        { withCredentials: true }
      );

      if (response.data.success) {
        const subscriptions = response.data.data;
        const activeClasses = subscriptions
          .filter((sub: Subscription) => sub.status === "ACTIVE")
          .map((sub: Subscription) => sub.zoomSession);

        setClasses(activeClasses);
      } else {
        throw new Error(response.data.message || "Failed to load classes");
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast({
        title: "Error",
        description: "Failed to load your classes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isUpcoming = (dateStr: string) => {
    return new Date(dateStr) > new Date();
  };

  const joinClass = (meetingLink: string) => {
    window.open(meetingLink, "_blank");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <p className="text-muted-foreground mb-4">
            You haven't enrolled in any classes yet
          </p>
          <Button asChild>
            <a href="/live-classes">Browse Classes</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">My Classes</h3>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((classItem) => (
          <Card key={classItem.id} className="overflow-hidden">
            <div className="relative aspect-video w-full">
              <Image
                src={classItem.thumbnailUrl || "/images/default-class.jpg"}
                alt={classItem.title}
                fill
                style={{ objectFit: "cover" }}
              />
              <div className="absolute top-2 right-2">
                <Badge
                  variant={
                    isUpcoming(classItem.startTime) ? "default" : "secondary"
                  }
                >
                  {isUpcoming(classItem.startTime) ? "Upcoming" : "Completed"}
                </Badge>
              </div>
            </div>

            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">{classItem.title}</CardTitle>
              <CardDescription>{classItem.teacherName}</CardDescription>
            </CardHeader>

            <CardContent className="p-4 pt-0 pb-4">
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{classItem.formattedDate}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{classItem.formattedTime}</span>
                </div>
              </div>

              {isUpcoming(classItem.startTime) && (
                <Button
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => joinClass(classItem.zoomLink)}
                >
                  Join Class
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyClasses;
