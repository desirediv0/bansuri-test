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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Calendar, Clock, Info, Tag } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface EditClassState {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  price: number;
  getPrice: boolean;
  registrationFee: number;
  courseFee: number;
  courseFeeEnabled: boolean;
  currentRaga?: string | null;
  currentOrientation?: string | null;
  isActive: boolean;
  thumbnailUrl?: string | null;
  capacity?: number | null;
  recurringClass: boolean;
  hasModules: boolean;
  isFirstModuleFree: boolean;
  sessionDescription?: string | null;
  slug: string;
}

export default function EditZoomClassPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;

  const [classData, setClassData] = useState<EditClassState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchClass = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/class/${classId}`,
          { withCredentials: true }
        );

        const classData = response.data.data;
        setClassData({
          ...classData,
          startTime: new Date(classData.startTime).toISOString().slice(0, 16),

          getPrice: classData.getPrice || false,
          recurringClass: classData.recurringClass || false,
          hasModules: classData.hasModules || false,
          isFirstModuleFree: classData.isFirstModuleFree || false,
        });
      } catch (error) {
        console.error("Error fetching class details:", error);
        toast({
          title: "Error",
          description: "Failed to load class details. Please try again.",
          variant: "destructive",
        });
        router.push("/dashboard/zoom");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClass();
  }, [classId, toast, router]);

  const handleImageUpload = (fileUrl: string) => {
    if (classData) {
      setClassData({ ...classData, thumbnailUrl: fileUrl });
    }
  };

  const updateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classData) return;

    setIsSaving(true);

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/class/${classData.id}`,
        {
          title: classData.title,
          description: classData.description,
          startTime: classData.startTime,
          price: 0,
          getPrice: false,
          registrationFee: parseFloat(classData.registrationFee.toString()),
          courseFee: parseFloat(classData.courseFee.toString()),
          courseFeeEnabled: classData.courseFeeEnabled,
          currentRaga: classData.currentRaga,
          currentOrientation: classData.currentOrientation,
          isActive: classData.isActive,
          thumbnailUrl: classData.thumbnailUrl,
          capacity: classData.capacity,
          recurringClass: false,
          hasModules: false,
          isFirstModuleFree: false,
          sessionDescription: classData.sessionDescription,
          slug: classData.slug,
        },
        { withCredentials: true }
      );

      toast({
        title: "Success",
        description: "Class updated successfully",
      });

      router.push("/dashboard/zoom");
    } catch (error: any) {
      console.error("Error updating class:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update class",
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

  if (!classData) {
    return (
      <div className="container mx-auto py-6">
        <p>Class not found</p>
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
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center">
            <Info className="h-5 w-5 mr-2 text-blue-500" />
            Class Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={updateClass} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Class Title</Label>
                  <Input
                    id="title"
                    value={classData.title}
                    onChange={(e) =>
                      setClassData({ ...classData, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={classData.description || ""}
                    onChange={(e) =>
                      setClassData({
                        ...classData,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="sessionDescription">
                    Session Description
                  </Label>
                  <Textarea
                    id="sessionDescription"
                    value={classData.sessionDescription || ""}
                    onChange={(e) =>
                      setClassData({
                        ...classData,
                        sessionDescription: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Schedule */}
              <div>
                <h3 className="text-base font-medium mb-4 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <div className="relative">
                      <Clock className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
                      <Input
                        id="startTime"
                        type="datetime-local"
                        value={classData.startTime}
                        onChange={(e) =>
                          setClassData({
                            ...classData,
                            startTime: e.target.value,
                          })
                        }
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Fees Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="registrationFee"
                    className="text-sm font-medium"
                  >
                    Registration Fee <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="registrationFee"
                    type="number"
                    value={classData.registrationFee}
                    onChange={(e) =>
                      setClassData({
                        ...classData,
                        registrationFee: parseFloat(e.target.value),
                      })
                    }
                    placeholder="Enter registration fee"
                    className="w-48"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="courseFee" className="text-sm font-medium">
                      Course Fee <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="courseFee"
                      type="number"
                      value={classData.courseFee}
                      onChange={(e) =>
                        setClassData({
                          ...classData,
                          courseFee: parseFloat(e.target.value),
                        })
                      }
                      placeholder="Enter course fee"
                      className="w-48"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch
                      id="courseFeeEnabled"
                      checked={classData.courseFeeEnabled}
                      onCheckedChange={(checked) =>
                        setClassData({
                          ...classData,
                          courseFeeEnabled: checked,
                        })
                      }
                    />
                    <Label htmlFor="courseFeeEnabled" className="text-sm">
                      Enable course fee requirement
                    </Label>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    When enabled, students must pay the course fee to access
                    class links after registration. When disabled, students get
                    access to links immediately after registration approval.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Class Details */}
              <div>
                <h3 className="text-base font-medium mb-4 flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-blue-500" />
                  Class Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentRaga">Current Raga</Label>
                    <Input
                      id="currentRaga"
                      value={classData.currentRaga || ""}
                      onChange={(e) =>
                        setClassData({
                          ...classData,
                          currentRaga: e.target.value,
                        })
                      }
                      placeholder="e.g., Madhyam Saptak, Sa - Pa"
                    />
                    <p className="text-xs text-gray-500">
                      Musical Raga covered in this class
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentOrientation">
                      Current Orientation
                    </Label>
                    <Input
                      id="currentOrientation"
                      value={classData.currentOrientation || ""}
                      onChange={(e) =>
                        setClassData({
                          ...classData,
                          currentOrientation: e.target.value,
                        })
                      }
                      placeholder="e.g., Hindi Classical, Carnatic"
                    />
                    <p className="text-xs text-gray-500">
                      Musical style or orientation
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={classData.capacity || ""}
                      onChange={(e) =>
                        setClassData({
                          ...classData,
                          capacity: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        })
                      }
                      placeholder="Maximum number of students"
                    />
                    <p className="text-xs text-gray-500">
                      Leave empty for unlimited capacity
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Thumbnail */}
              <div>
                <h3 className="text-base font-medium mb-4">Thumbnail Image</h3>
                <FileUpload
                  onUploadComplete={handleImageUpload}
                  existingImageUrl={classData.thumbnailUrl || null}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Recommended size: 1280x720px (16:9 ratio)
                </p>
              </div>

              <Separator />

              {/* Settings */}
              <div>
                <h3 className="text-base font-medium mb-4">Settings</h3>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="isActive" className="cursor-pointer">
                      Active Status
                    </Label>
                    <p className="text-xs text-gray-500">
                      Make this class visible to students
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={classData.isActive}
                    onCheckedChange={(checked) =>
                      setClassData({ ...classData, isActive: checked })
                    }
                  />
                </div>
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
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
