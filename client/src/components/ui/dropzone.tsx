"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
    onUploadComplete: (fileUrl: string) => void;
    existingImageUrl?: string | null;
    className?: string;
    uploadEndpoint?: string;
    maxSize?: number;
    acceptedFileTypes?: string;
}

export function FileUpload({
    onUploadComplete,
    existingImageUrl = null,
    className = "",
    uploadEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/upload/zoom-thumbnail`,
    maxSize = 2 * 1024 * 1024, // 2MB default
    acceptedFileTypes = "image/jpeg,image/png,image/webp"
}: FileUploadProps) {
    const [uploadedImage, setUploadedImage] = useState<string | null>(existingImageUrl);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            if (acceptedFiles.length === 0) return;

            const file = acceptedFiles[0];

            if (file.size > maxSize) {
                toast({
                    title: "File too large",
                    description: `Maximum file size is ${maxSize / (1024 * 1024)}MB`,
                    variant: "destructive",
                });
                return;
            }

            setIsUploading(true);

            try {
                const formData = new FormData();
                formData.append("image", file);

                const response = await axios.post(uploadEndpoint, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                    withCredentials: true,
                });

                const fileUrl = response.data.data.url;
                setUploadedImage(fileUrl);
                onUploadComplete(fileUrl);

                toast({
                    title: "Upload successful",
                    description: "Your image has been uploaded.",
                });
            } catch (error: any) {
                console.error("Error uploading file:", error);
                toast({
                    title: "Upload failed",
                    description: error.response?.data?.message || "Failed to upload the image.",
                    variant: "destructive",
                });
            } finally {
                setIsUploading(false);
            }
        },
        [maxSize, onUploadComplete, toast, uploadEndpoint]
    );

    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
        onDrop,
        accept: {
            [acceptedFileTypes]: [],
        },
        maxFiles: 1,
        maxSize,
    });

    const removeImage = () => {
        setUploadedImage(null);
        onUploadComplete("");
    };

    // Show file size or type validation errors
    React.useEffect(() => {
        if (fileRejections.length > 0) {
            const errors = fileRejections[0].errors.map(e => e.message).join(", ");
            toast({
                title: "Invalid file",
                description: errors,
                variant: "destructive",
            });
        }
    }, [fileRejections, toast]);

    return (
        <div className={`w-full ${className}`}>
            {uploadedImage ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                    <Image
                        src={uploadedImage}
                        alt="Upload preview"
                        fill
                        style={{ objectFit: "cover" }}
                    />
                    <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                    >
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 cursor-pointer 
            flex flex-col items-center justify-center h-40
            ${isDragActive ? "border-primary bg-primary/10" : "border-gray-300"}`}
                >
                    <input {...getInputProps()} />
                    {isUploading ? (
                        <div className="flex flex-col items-center">
                            <Loader2 size={24} className="animate-spin text-primary mb-2" />
                            <p className="text-sm text-gray-500">Uploading...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <Upload size={24} className="mb-2" />
                            <p className="text-sm text-gray-500">
                                {isDragActive
                                    ? "Drop the image here..."
                                    : "Drag & drop an image, or click to select"}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                PNG, JPG, WebP up to {maxSize / (1024 * 1024)}MB
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
