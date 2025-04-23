"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Save,
  Calendar,
  Info,
  Tag,
  IndianRupee,
  Clock,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface FormData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  price: string;
  thumbnailUrl: string;
  registrationFee: string;
  courseFee: string;
  currentRange: string;
  currentOrientation: string;
  isActive: boolean;
}

export default function CreateZoomSessionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    price: "0",
    thumbnailUrl: "",
    registrationFee: "0",
    courseFee: "0",
    currentRange: "",
    currentOrientation: "",
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleImageUpload = (fileUrl: string) => {
    setFormData((prev) => ({ ...prev, thumbnailUrl: fileUrl }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.title ||
      !formData.startTime ||
      !formData.endTime ||
      !formData.registrationFee ||
      !formData.courseFee
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check if end time is after start time
    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      toast({
        title: "Invalid Time",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Prepare payload
      const payload: any = {
        title: formData.title,
        description: formData.description,
        startTime: formData.startTime,
        endTime: formData.endTime,
        price: parseFloat(formData.price),
        registrationFee: parseFloat(formData.registrationFee),
        courseFee: parseFloat(formData.courseFee),
        currentRange: formData.currentRange || null,
        currentOrientation: formData.currentOrientation || null,
        isActive: formData.isActive,
      };

      // Include thumbnailUrl if it has a value
      if (formData.thumbnailUrl) {
        payload.thumbnailUrl = formData.thumbnailUrl;
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom/admin/session`,
        payload,
        { withCredentials: true }
      );

      toast({
        title: "Success",
        description: "Live class session created successfully",
      });

      router.push("/dashboard/zoom");
    } catch (error: any) {
      console.error("Error creating live class session:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to create session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="p-0 h-auto"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Live Classes
        </Button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Create New Live Class</h1>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center">
            <Info className="h-5 w-5 mr-2 text-blue-500" />
            Class Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Class Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter a descriptive title for your class"
                    className="w-full"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Class Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Provide details about what students will learn"
                    rows={4}
                    className="resize-none"
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
                    <Label htmlFor="startTime" className="text-sm font-medium">
                      Start Time <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Clock className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
                      <Input
                        id="startTime"
                        name="startTime"
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime" className="text-sm font-medium">
                      End Time <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Clock className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
                      <Input
                        id="endTime"
                        name="endTime"
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Pricing */}
              <div>
                <h3 className="text-base font-medium mb-4 flex items-center">
                  <IndianRupee className="h-4 w-4 mr-2 text-blue-500" />
                  Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="registrationFee"
                      className="text-sm font-medium"
                    >
                      Registration Fee (₹){" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">
                        ₹
                      </span>
                      <Input
                        id="registrationFee"
                        name="registrationFee"
                        type="number"
                        min="0"
                        value={formData.registrationFee}
                        onChange={handleChange}
                        className="pl-7"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Initial fee to reserve a spot
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="courseFee" className="text-sm font-medium">
                      Course Fee (₹) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">
                        ₹
                      </span>
                      <Input
                        id="courseFee"
                        name="courseFee"
                        type="number"
                        min="0"
                        value={formData.courseFee}
                        onChange={handleChange}
                        className="pl-7"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Fee to access class links
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-medium">
                      Monthly Price (₹)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">
                        ₹
                      </span>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        min="0"
                        value={formData.price}
                        onChange={handleChange}
                        className="pl-7"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      For subscription model (optional)
                    </p>
                  </div>
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
                    <Label
                      htmlFor="currentRange"
                      className="text-sm font-medium"
                    >
                      Current Raga
                    </Label>
                    <Input
                      id="currentRange"
                      name="currentRange"
                      value={formData.currentRange}
                      onChange={handleChange}
                      placeholder="e.g., Madhyam Saptak, Sa - Pa"
                    />
                    <p className="text-xs text-gray-500">
                      Musical range covered in this class
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="currentOrientation"
                      className="text-sm font-medium"
                    >
                      Current Orientation
                    </Label>
                    <Input
                      id="currentOrientation"
                      name="currentOrientation"
                      value={formData.currentOrientation}
                      onChange={handleChange}
                      placeholder="e.g., Hindi Classical, Carnatic"
                    />
                    <p className="text-xs text-gray-500">
                      Musical style or orientation
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
                  existingImageUrl={formData.thumbnailUrl}
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
                    <Label htmlFor="isActive" className="text-sm font-medium">
                      Active Status
                    </Label>
                    <p className="text-xs text-gray-500">
                      Make this class visible to students
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("isActive", checked)
                    }
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/zoom")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    "Creating..."
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Create Class
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
