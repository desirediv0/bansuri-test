"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";

interface ZoomSession {
  id: string;
  title: string;
}

export default function DeleteZoomSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<ZoomSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/class/${sessionId}`,
          { withCredentials: true }
        );
        setSession(response.data.data);
      } catch (error) {
        console.error("Error fetching session details:", error);
        toast({
          title: "Error",
          description: "Failed to fetch session details",
          variant: "destructive",
        });
        router.push("/dashboard/zoom");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId, router, toast]);

  const handleDelete = async () => {
    if (!session) return;

    setIsDeleting(true);
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/class/${session.id}`,
        { withCredentials: true }
      );

      toast({
        title: "Success",
        description: "Session deleted successfully",
      });

      router.push("/dashboard/zoom");
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto py-6">
        <p>Session not found</p>
        <Button onClick={() => router.push("/dashboard/zoom")}>
          Back to Live Classes
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/zoom")}
          className="p-0 h-auto"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Live Classes
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Delete Live Class</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Confirm Deletion
          </CardTitle>
          <CardDescription>
            Are you sure you want to delete this session? This action cannot be
            undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="font-medium">You are about to delete:</p>
            <p className="text-lg font-bold mt-1">{session.title}</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/zoom")}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Session"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
