"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/dropzone";

interface FormData {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    price: string;
    thumbnailUrl: string;
}

interface CreateZoomSessionFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateZoomSessionForm({ onClose, onSuccess }: CreateZoomSessionFormProps) {
    const [formData, setFormData] = useState<FormData>({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        price: "",
        thumbnailUrl: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (fileUrl: string) => {
        setFormData((prev) => ({ ...prev, thumbnailUrl: fileUrl }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Basic validation
        if (!formData.title || !formData.startTime || !formData.endTime || !formData.price) {
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
            // Only send fields that exist in your database
            const payload = {
                title: formData.title,
                description: formData.description,
                startTime: formData.startTime,
                endTime: formData.endTime,
                price: parseFloat(formData.price),
            };

            // Only include thumbnailUrl if it has a value
            if (formData.thumbnailUrl) {
                // @ts-ignore - In case the API doesn't support this field yet
                payload.thumbnailUrl = formData.thumbnailUrl;
            }

            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/zoom/admin/session`,
                payload,
                { withCredentials: true }
            );

            toast({
                title: "Success",
                description: "Zoom session created successfully",
            });

            onSuccess();
        } catch (error: any) {
            console.error("Error creating zoom session:", error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to create session",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Zoom Session</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Session Title *</Label>
                        <Input
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter session title"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Enter session description"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Thumbnail Image</Label>
                        <FileUpload
                            onUploadComplete={handleImageUpload}
                            existingImageUrl={formData.thumbnailUrl}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startTime">Start Time *</Label>
                            <Input
                                id="startTime"
                                name="startTime"
                                type="datetime-local"
                                value={formData.startTime}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endTime">End Time *</Label>
                            <Input
                                id="endTime"
                                name="endTime"
                                type="datetime-local"
                                value={formData.endTime}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="price">Monthly Price (₹) *</Label>
                        <Input
                            id="price"
                            name="price"
                            type="number"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="Enter price in INR"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Session"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
