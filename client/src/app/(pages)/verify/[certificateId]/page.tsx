"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Shield, CheckCircle, XCircle } from 'lucide-react';

interface CertificateData {
    studentName: string;
    courseName: string;
    issueDate: string;
    grade?: string;
    certificateId: string;
}

export default function VerifyCertificate({ params }: { params: { certificateId: string } }) {
    const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const verifyCertificate = async () => {
            try {
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/certificates/verify/${params.certificateId}`
                );
                setCertificateData(response.data.data.certificateData);
            } catch (err) {
                setError("Invalid or expired certificate");
            } finally {
                setIsLoading(false);
            }
        };

        verifyCertificate();
    }, [params.certificateId]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-red-600 mx-auto mb-4 animate-pulse" />
                    <h2 className="text-2xl font-bold">Verifying Certificate...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-red-600">Invalid Certificate</h2>
                    <p className="mt-2 text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-900">Certificate Verified</h2>
                </div>

                <div className="space-y-6">
                    <div className="border-t border-b border-gray-200 py-6">
                        <dl className="divide-y divide-gray-200">
                            <div className="py-4 grid grid-cols-3 gap-4">
                                <dt className="font-medium text-gray-500">Student Name</dt>
                                <dd className="col-span-2 text-gray-900">{certificateData?.studentName}</dd>
                            </div>
                            <div className="py-4 grid grid-cols-3 gap-4">
                                <dt className="font-medium text-gray-500">Course</dt>
                                <dd className="col-span-2 text-gray-900">{certificateData?.courseName}</dd>
                            </div>
                            <div className="py-4 grid grid-cols-3 gap-4">
                                <dt className="font-medium text-gray-500">Issue Date</dt>
                                <dd className="col-span-2 text-gray-900">{certificateData?.issueDate}</dd>
                            </div>
                            {certificateData?.grade && (
                                <div className="py-4 grid grid-cols-3 gap-4">
                                    <dt className="font-medium text-gray-500">Grade Achieved</dt>
                                    <dd className="col-span-2 text-gray-900">{certificateData.grade}</dd>
                                </div>
                            )}
                            <div className="py-4 grid grid-cols-3 gap-4">
                                <dt className="font-medium text-gray-500">Certificate ID</dt>
                                <dd className="col-span-2 font-mono text-gray-900">{certificateData?.certificateId}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
} 