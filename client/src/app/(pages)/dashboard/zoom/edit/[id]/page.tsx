"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

interface EditSessionState {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  price: number;
  isActive: boolean;
  thumbnailUrl?: string | null;
}

export default function EditZoomSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<EditSessionState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/zoom/session/${sessionId}`,
          { withCredentials: true }
        );

        const sessionData = response.data.data;
        setSession({
          ...sessionData,
          startTime: new Date(sessionData.startTime).toISOString().slice(0, 16),
          endTime: new Date(sessionData.endTime).toISOString().slice(0, 16),
        });
      } catch (error) {
        console.error("Error fetching session details:", error);
        toast({
          title: "Error",
          description: "Failed to load session details. Please try again.",
          variant: "destructive",
        });
        router.push("/dashboard/zoom");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, toast, router]);

  const handleImageUpload = (fileUrl: string) => {
    if (session) {
      setSession({ ...session, thumbnailUrl: fileUrl });
    }
  };

  const updateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    setIsSaving(true);

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom/admin/session/${session.id}`,
        {
          title: session.title,
          description: session.description,
          startTime: session.startTime,
          endTime: session.endTime,
          price: parseFloat(session.price.toString()),
          isActive: session.isActive,
          thumbnailUrl: session.thumbnailUrl,
        },
        { withCredentials: true }
      );

      toast({
        title: "Success",
        description: "Session updated successfully",
      });

      router.push("/dashboard/zoom");
    } catch (error: any) {
      console.error("Error updating session:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update session",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
        <h1 className="text-2xl font-bold">Edit Live Class</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={updateSession} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Session Title</Label>
              <Input
                id="title"
                value={session.title}
                onChange={(e) =>
                  setSession({ ...session, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={session.description || ""}
                onChange={(e) =>
                  setSession({ ...session, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={session.startTime}
                  onChange={(e) =>
                    setSession({ ...session, startTime: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={session.endTime}
                  onChange={(e) =>
                    setSession({ ...session, endTime: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={session.price}
                onChange={(e) =>
                  setSession({ ...session, price: parseFloat(e.target.value) })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Thumbnail Image</Label>
              <FileUpload
                onUploadComplete={handleImageUpload}
                existingImageUrl={session.thumbnailUrl || null}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={session.isActive}
                onCheckedChange={(checked) =>
                  setSession({ ...session, isActive: checked })
                }
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/zoom")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
