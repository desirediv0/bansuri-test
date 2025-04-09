"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Download, Award } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface Certificate {
    id: string
    certificateId: string
    completedAt: string
    grade: string | null
    course: {
        title: string
        description: string
    }
}

export default function UserCertificates() {
    const [certificates, setCertificates] = useState<Certificate[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCertificates()
    }, [])

    const fetchCertificates = async () => {
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/certificates/user`,
                { 
                    withCredentials: true,
                }
            )
            setCertificates(response.data.data)
        } catch (error) {
            console.error("Error fetching certificates:", error)
            toast.error("Failed to fetch certificates")
        } finally {
            setLoading(false)
        }
    }

    const downloadCertificate = async (certificateId: string) => {
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/certificates/download/${certificateId}`,
                {
                    responseType: 'blob',
                    withCredentials: true
                }
            )

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `certificate-${certificateId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Error downloading certificate:", error)
            toast.error("Failed to download certificate")
        }
    }

    if (loading) {
        return <CertificatesSkeleton />
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Award className="h-6 w-6 text-red-600" />
                    My Certificates
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                        {certificates.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500">Complete courses to earn certificates</p>
                            </div>
                        ) : (
                            certificates.map((cert) => (
                                <div key={cert.id} className="p-4 rounded-lg border bg-white hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <h3 className="font-medium text-gray-900">{cert.course.title}</h3>
                                            <p className="text-sm text-gray-600">
                                                Completed on: {format(new Date(cert.completedAt), "PPP")}
                                            </p>
                                            {cert.grade && (
                                                <p className="text-sm text-gray-600">
                                                    Grade: {cert.grade}
                                                </p>
                                            )}
                                        </div>
                                        <Button 
                                            onClick={() => downloadCertificate(cert.certificateId)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

function CertificatesSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-[200px]" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 border rounded-lg">
                            <div className="flex justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-[200px]" />
                                    <Skeleton className="h-4 w-[150px]" />
                                </div>
                                <Skeleton className="h-9 w-[100px]" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
} 