"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

export default function ImportUsersPage() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0];
        if (selectedFile) {
            // Check file size (5MB = 5 * 1024 * 1024 bytes)
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast({
                    title: "File too large",
                    description: "Please upload a file smaller than 5MB",
                    variant: "destructive",
                });
                return;
            }

            if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
                toast({
                    title: "Invalid file type",
                    description: "Please upload only Excel files (xlsx/xls)",
                    variant: "destructive",
                });
                return;
            }
            setFile(selectedFile);
        }
    }, [toast]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
        },
        maxFiles: 1,
        maxSize: 5 * 1024 * 1024, // 5MB in bytes
        onDropRejected: (fileRejections) => {
            const error = fileRejections[0]?.errors[0];
            if (error?.code === 'file-too-large') {
                toast({
                    title: "File too large",
                    description: "Please upload a file smaller than 5MB",
                    variant: "destructive",
                });
            }
        },
    });

    const handleUpload = async () => {
        if (!file) {
            toast({
                title: "Error",
                description: "Please select a file first",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/user/import-users`,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (response.data.data.results.errors.length > 0) {
                toast({
                    title: "Partial Success",
                    description: `Imported ${response.data.data.results.successful} users with ${response.data.data.results.errors.length} errors`,

                });
                console.log('Import errors:', response.data.data.results.errors);
            } else {
                toast({
                    title: "Success",
                    description: `Successfully imported ${response.data.data.results.successful} users`,
                });
            }

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to import users",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            setFile(null);
        }
    };

    const removeFile = () => setFile(null);

    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Import Users</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div {...getRootProps()} className={`flex items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer p-6 ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center justify-center text-center">
                            <Upload className="w-10 h-10 mb-3 text-gray-400" />
                            {isDragActive ? (
                                <p className="text-sm text-gray-500">Drop the Excel file here</p>
                            ) : (
                                <>
                                    <p className="mb-2 text-sm text-gray-500">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500">Excel file (XLSX/XLS)</p>
                                    <span className="text-xs text-gray-500">
                                        Max file size: <span className="font-semibold">5MB</span>
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {file && (
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-500">{file.name}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={removeFile}
                                disabled={loading}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    <Button
                        onClick={handleUpload}
                        disabled={!file || loading}
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <span className="loading loading-spinner loading-sm mr-2"></span>
                                Importing...
                            </>
                        ) : (
                            "Import Users"
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}