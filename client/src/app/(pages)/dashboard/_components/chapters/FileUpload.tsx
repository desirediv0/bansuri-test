"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash, AudioLines, FileText } from "lucide-react";
import { Accept } from "react-dropzone";

interface FileUploadProps {
    accept: Accept;
    value: File | string | null;
    onChange: (file: File | null) => void;
    onRemove: () => void;
    fileType: "pdf" | "audio";
    existingFileUrl: string | null;
}

export default function FileUpload({
    accept,
    value,
    onChange,
    onRemove,
    fileType,
    existingFileUrl
}: FileUploadProps) {
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (value instanceof globalThis.File) {
            const reader = new FileReader();
            reader.onload = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(value);
        } else if (typeof value === "string") {
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';
            const mediaBaseUrl = apiBaseUrl.replace('/api/v1', '');
            setPreview(`${mediaBaseUrl}/${value}`);
        } else if (existingFileUrl) {
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';
            const mediaBaseUrl = apiBaseUrl.replace('/api/v1', '');
            setPreview(`${mediaBaseUrl}/${existingFileUrl}`);
        } else {
            setPreview(null);
        }
    }, [value, existingFileUrl]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            onChange(file);
        }
    };

    const renderPreview = () => {
        if (!preview) return null;

        if (fileType === "pdf") {
            return (
                <div className="mt-2 space-y-2">
                    <div className="flex items-center p-2 border rounded">
                        <FileText className="h-6 w-6 mr-2 text-red-500" />
                        <span className="text-sm truncate flex-1">
                            {value instanceof globalThis.File ? value.name : "PDF Document"}
                        </span>
                        <a
                            href={preview}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 text-sm hover:underline ml-2"
                        >
                            View
                        </a>
                    </div>
                </div>
            );
        }

        if (fileType === "audio") {
            return (
                <div className="mt-2 space-y-2">
                    <div className="flex items-center p-2 border rounded">
                        <AudioLines className="h-6 w-6 mr-2 text-blue-500" />
                        <span className="text-sm truncate flex-1">
                            {value instanceof globalThis.File ? value.name : "Audio File"}
                        </span>
                    </div>
                    <audio controls className="w-full">
                        <source src={preview} />
                        Your browser does not support the audio element.
                    </audio>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="space-y-4">
            {!value ? (
                <div className="flex">
                    <Input
                        type="file"
                        accept={Object.keys(accept).join(",")}
                        onChange={handleChange}
                        className="max-w-sm"
                    />
                </div>
            ) : (
                <div className="space-y-2">
                    {renderPreview()}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onRemove}
                        className="mt-2"
                    >
                        <Trash className="h-4 w-4 mr-2" />
                        Remove {fileType === "pdf" ? "PDF" : "Audio"}
                    </Button>
                </div>
            )}
        </div>
    );
}
