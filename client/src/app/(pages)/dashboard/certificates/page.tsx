"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import axios from "axios"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Download, Trash2, Award } from "lucide-react"
import { useAuth } from "@/helper/AuthContext"

interface Certificate {
    id: string
    certificateId: string
    completedAt: string
    grade: string | null
    user: {
        name: string
        email: string
    }
    course: {
        title: string
    }
}

export default function AdminCertificates() {
    const [certificates, setCertificates] = useState<Certificate[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const { checkAuth } = useAuth()

    useEffect(() => {
        fetchCertificates()
    }, [])

    const fetchCertificates = async () => {
        try {
            const isAuth = await checkAuth()
            if (!isAuth) return

            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/certificates/all`,
                { withCredentials: true }
            )
            setCertificates(response.data.data)
        } catch (error) {
            console.error("Error fetching certificates:", error)
            toast.error("Failed to fetch certificates")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (certificateId: string) => {
        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_API_URL}/certificates/delete/${certificateId}`,
                { withCredentials: true }
            )
            toast.success("Certificate deleted successfully")
            fetchCertificates()
        } catch (error) {
            console.error("Error deleting certificate:", error)
            toast.error("Failed to delete certificate")
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

    const filteredCertificates = certificates.filter(cert =>
        cert.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.certificateId.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return <div>Loading certificates...</div>
    }

    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <Award className="h-6 w-6 text-red-600" />
                        Certificates Management
                    </CardTitle>
                    <div className="flex items-center gap-4">
                        <Input
                            placeholder="Search certificates..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-xs"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Course</TableHead>
                                <TableHead>Completed On</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>Certificate ID</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCertificates.map((cert) => (
                                <TableRow key={cert.id}>
                                    <TableCell>{cert.user.name}</TableCell>
                                    <TableCell>{cert.user.email}</TableCell>
                                    <TableCell>{cert.course.title}</TableCell>
                                    <TableCell>
                                        {format(new Date(cert.completedAt), "PPP")}
                                    </TableCell>
                                    <TableCell>{cert.grade || "N/A"}</TableCell>
                                    <TableCell>
                                        <code className="text-sm">{cert.certificateId}</code>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => downloadCertificate(cert.certificateId)}
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(cert.certificateId)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
} 