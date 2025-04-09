"use client"

import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { useAuth } from "@/helper/AuthContext"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Trash, Download } from "lucide-react"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { FeeTableSkeleton } from "./loading"
import { Progress } from "@/components/ui/progress"
import axios from "axios"
import { BarChart } from "@/components/ui/bar-chart"
import * as XLSX from "xlsx"

interface Fee {
    id: string
    title: string
    amount: number
    dueDate: string
    type: string
    status: string
    description?: string
    lateFeeDate?: string
    lateFeeAmount?: number
    isOfflineFee: boolean
    userId: string
    user: {
        name: string
        email: string
    }
    totalPaid: number
    remaining: number
    payments: any[]
}

interface Student {
    id: string
    name: string
    email: string
    usertype: string
    isOffline: boolean
}

// Add this type for editable fields
type EditableField = {
    key: keyof Fee
    label: string
}

// Add this constant for editable fields
const EDITABLE_FIELDS: EditableField[] = [
    { key: "title", label: "Title" },
    { key: "amount", label: "Amount" },
    { key: "dueDate", label: "Due Date" },
    { key: "type", label: "Type" },
    { key: "description", label: "Description" },
    { key: "lateFeeDate", label: "Late Fee Date" },
    { key: "lateFeeAmount", label: "Late Fee Amount" },
]

// Add this type for custom badge variants
type CustomBadgeVariant = "success" | "warning" | "default" | "destructive" | "outline" | "secondary"

// Update the Badge component to handle custom variants
const CustomBadge = ({
    variant,
    children,
    className,
}: {
    variant: CustomBadgeVariant
    children: React.ReactNode
    className?: string
}) => {
    const getVariantStyles = (variant: CustomBadgeVariant) => {
        switch (variant) {
            case "success":
                return "bg-green-100 text-green-800 border-green-200"
            case "warning":
                return "bg-yellow-100 text-yellow-800 border-yellow-200"
            case "destructive":
                return "bg-red-100 text-red-800 border-red-200"
            default:
                return ""
        }
    }

    return (
        <Badge variant="outline" className={cn(getVariantStyles(variant), className)}>
            {children}
        </Badge>
    )
}

// Add these new components for analytics
const FeeAnalytics = () => {
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState({
        startDate: null,
        endDate: null,
    })
    const [selectedType, setSelectedType] = useState("")

    const fetchAnalytics = async () => {
        try {
            setLoading(true)
            let url = `${process.env.NEXT_PUBLIC_API_URL}/fees/analytics`

            // Add query parameters if filters are set
            const params = new URLSearchParams()
            if (dateRange.startDate) params.append("startDate", dateRange.startDate)
            if (dateRange.endDate) params.append("endDate", dateRange.endDate)
            if (selectedType) params.append("type", selectedType)

            if (params.toString()) {
                url += `?${params.toString()}`
            }

            const response = await axios.get(url, { withCredentials: true })

            if (response.data?.success) {
                setAnalytics(response.data.data)
            }
        } catch (error) {
            console.error("Error fetching analytics:", error)
            toast.error("Failed to fetch analytics")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAnalytics()
    }, [dateRange, selectedType])

    if (loading) return <div>Loading analytics...</div>

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Summary Cards */}
            <Card>
                <CardHeader>
                    <CardTitle>Total Collection</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{analytics?.collectedAmount.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">of ₹{analytics?.totalAmount.toFixed(2)}</p>
                    <Progress value={analytics?.collectionRate} className="mt-2" />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Payment Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {Object.entries(analytics?.paymentStatus || {}).map(([status, count]) => (
                            <div key={status} className="flex justify-between">
                                <span>{status as string}</span>
                                <span>{count as number}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Monthly Collection Chart */}
            <Card className="col-span-full">
                <CardHeader>
                    <CardTitle>Monthly Collection</CardTitle>
                </CardHeader>
                <CardContent>
                    <BarChart
                        data={Object.entries(analytics?.monthlyCollection || {}).map(([month, amount]) => ({
                            month,
                            amount: typeof amount === "number" ? amount : 0,
                        }))}
                    />
                </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card className="col-span-full">
                <CardHeader>
                    <CardTitle>Recent Payments</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Fee Type</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {analytics?.recentPayments.map((payment: any) => (
                                <TableRow key={payment.id}>
                                    <TableCell>{payment.user.name}</TableCell>
                                    <TableCell>₹{payment.amount}</TableCell>
                                    <TableCell>{payment.fee.type}</TableCell>
                                    <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
interface FeeFormData {
    title: string
    amount: number
    type: string
    description?: string
    lateFeeAmount?: number
    lateFeeDate?: string
    dueDate?: string
    isOfflineFee?: boolean
    userId: string
}
export default function FeesPage() {
    const [fees, setFees] = useState<Fee[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedFee, setSelectedFee] = useState<Fee | null>(null)
    const { checkAuth } = useAuth()
    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors }
    } = useForm<FeeFormData>({
        defaultValues: {
            title: '',
            amount: 0,
            type: '',
            description: '',
            lateFeeAmount: 0,
            lateFeeDate: '',
            dueDate: ''
        }
    });
    const [editDate, setEditDate] = useState<Date>()
    const [createDate, setCreateDate] = useState<Date>()
    const [editLateFeeDate, setEditLateFeeDate] = useState<Date>()
    const [selectedFields, setSelectedFields] = useState<Set<keyof Fee>>(new Set())
    const [createLateFeeDate, setCreateLateFeeDate] = useState<Date>()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editFormData, setEditFormData] = useState<any>(null)
    const [isSubmitting, setIsSubmitting] = useState(false);



    useEffect(() => {
        fetchFees()
        fetchStudents()
    }, [])

    const fetchFees = async () => {
        setLoading(true)
        const isAuth = await checkAuth()
        if (!isAuth) {
            setLoading(false)
            return
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fees/all`, {
                credentials: "include",
            })
            if (response.ok) {
                const data = await response.json()
                setFees(data.data)
            } else {
                console.error("Failed to fetch fees")
            }
        } catch (error) {
            console.error("Error fetching fees:", error)
        }
        setLoading(false)
    }

    const fetchStudents = async () => {
        const isAuth = await checkAuth()
        if (!isAuth) return

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fees/students`, {
                credentials: "include",
            })
            if (response.ok) {
                const data = await response.json()
                setStudents(data.data)
            } else {
                console.error("Failed to fetch students")
            }
        } catch (error) {
            console.error("Error fetching students:", error)
        }
    }

    const handleAddFee = async (data: any) => {
        const isAuth = await checkAuth()
        if (!isAuth) return

        // Validate required fields
        if (!data.userId || !data.title || !data.amount || !data.type || !createDate) {
            toast.error("Please fill all required fields")
            return
        }

        try {
            // Format the request data
            const feeData = {
                userId: data.userId,
                title: data.title,
                amount: Number.parseFloat(data.amount),
                dueDate: format(createDate, "yyyy-MM-dd"), // Use the createDate state
                type: data.type,
                description: data.description || null,
                lateFeeDate: data.lateFeeDate ? format(new Date(data.lateFeeDate), "yyyy-MM-dd") : null,
                lateFeeAmount: data.lateFeeAmount ? Number.parseFloat(data.lateFeeAmount) : null,
                isOfflineFee: data.isOfflineFee || false
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fees/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(feeData),
                credentials: "include",
            })

            if (response.ok) {
                toast.success("Fee created successfully")
                fetchFees()
                reset()
                setCreateDate(undefined) // Reset the date
            } else {
                const errorData = await response.json()
                toast.error(errorData.message || "Failed to add fee")
            }
        } catch (error) {
            toast.error("Error adding fee")
            console.error("Error adding fee:", error)
        }
    }

    const handleEditClick = (fee: Fee) => {
        setSelectedFee(fee);
        setEditFormData({
            title: fee.title,
            amount: fee.amount,
            dueDate: new Date(fee.dueDate),
            type: fee.type,
            description: fee.description || "",
            lateFeeDate: fee.lateFeeDate ? new Date(fee.lateFeeDate) : undefined,
            lateFeeAmount: fee.lateFeeAmount || "",
        });
        setEditDate(new Date(fee.dueDate));
        setEditLateFeeDate(fee.lateFeeDate ? new Date(fee.lateFeeDate) : undefined);
        setSelectedFields(new Set()); // Reset selected fields
        setIsDialogOpen(true);
    };

    const onSubmitUpdate = async (formData: any) => {
        if (!selectedFee) {
            toast.error("No fee selected");
            return;
        }

        if (selectedFields.size === 0) {
            toast.error("No fields selected for update");
            return;
        }

        setIsSubmitting(true);
        try {
            const updateData = {
                ...(selectedFields.has('title') && { title: formData.title }),
                ...(selectedFields.has('amount') && { amount: Number.parseFloat(formData.amount) }),
                ...(selectedFields.has('type') && { type: formData.type }),
                ...(selectedFields.has('description') && { description: formData.description }),
                ...(selectedFields.has('dueDate') && { dueDate: format(editDate!, "yyyy-MM-dd") }),
                ...(selectedFields.has('lateFeeDate') && { lateFeeDate: format(editLateFeeDate!, "yyyy-MM-dd") }),
                ...(selectedFields.has('lateFeeAmount') && { lateFeeAmount: Number.parseFloat(formData.lateFeeAmount) })
            };

            const response = await axios.patch(
                `${process.env.NEXT_PUBLIC_API_URL}/fees/update/${selectedFee.id}`,
                updateData,
                { withCredentials: true }
            );
            if (response.data?.success) {
                toast.success("Fee updated successfully");
                await fetchFees();
                setIsDialogOpen(false);
                setEditDate(undefined);
                reset();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message || "Update failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteFee = async (id: string) => {
        const isAuth = await checkAuth()
        if (!isAuth) return

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fees/delete/${id}`, {
                method: "DELETE",
                credentials: "include",
            })
            if (response.ok) {
                fetchFees()
            } else {
                console.error("Failed to delete fee")
            }
        } catch (error) {
            console.error("Error deleting fee:", error)
        }
    }

    const handleEditDateSelect = (date: Date | undefined) => {
        setEditDate(date)
        if (date) {
            const formattedDate = format(date, "yyyy-MM-dd")
            const event = { target: { value: formattedDate } }
            register("dueDate").onChange(event)
        }
    }

    const handleCreateDateSelect = (date: Date | undefined) => {
        setCreateDate(date)
    }

    const handleEditLateFeeSelect = (date: Date | undefined) => {
        setEditLateFeeDate(date)
        if (date) {
            const formattedDate = format(date, "yyyy-MM-dd")
            const event = { target: { value: formattedDate } }
            register("lateFeeDate").onChange(event)
        }
    }

    const handleCreateLateFeeSelect = (date: Date | undefined) => {
        setCreateLateFeeDate(date)
        if (date) {
            const formattedDate = format(date, "yyyy-MM-dd")
            const event = { target: { value: formattedDate } }
            register("lateFeeDate").onChange(event)
        }
    }

    const exportToExcel = () => {
        if (!fees.length) {
            toast.error("No data to export")
            return
        }

        const dataToExport = fees.map(fee => ({
            "Student Name": fee.user.name,
            "Email": fee.user.email,
            "Title": fee.title,
            "Amount": fee.amount,
            "Due Date": format(new Date(fee.dueDate), "PP"),
            "Status": fee.status,
            "Total Paid": fee.totalPaid,
            "Remaining": fee.remaining,
            "Type": fee.type
        }))

        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Fees")

        XLSX.writeFile(wb, `fees_report_${format(new Date(), "dd-MM-yyyy")}.xlsx`)
    }

    if (loading) return <FeeTableSkeleton />

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Fee Management</h1>
                <Button
                    onClick={exportToExcel}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Export to Excel
                </Button>
            </div>

            <Tabs defaultValue="all-fees">
                <TabsList>
                    <TabsTrigger value="all-fees">All Fees</TabsTrigger>
                    <TabsTrigger value="add-fee">Add Fee</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>
                <TabsContent value="all-fees">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Fees</CardTitle>
                            <CardDescription>Manage and view all fees</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Late Fee</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fees.map((fee) => (
                                        <TableRow key={fee.id}>
                                            <TableCell className="font-medium">{fee.title}</TableCell>
                                            <TableCell>{fee.user.name}</TableCell>
                                            <TableCell>₹{fee.amount}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{new Date(fee.dueDate).toLocaleDateString()}</span>
                                                    {new Date(fee.dueDate) < new Date() && fee.status !== "PAID" && (
                                                        <Badge variant="destructive" className="w-fit">Overdue</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {fee.lateFeeAmount ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span>₹{fee.lateFeeAmount}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            After {new Date(fee.lateFeeDate!).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    "N/A"
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{fee.type}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <CustomBadge
                                                    variant={
                                                        fee.status === "PAID" ? "success" :
                                                            fee.status === "PARTIAL" ? "warning" : "default"
                                                    }
                                                >
                                                    {fee.status}
                                                </CustomBadge>
                                            </TableCell>
                                            <TableCell>
                                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="mr-2"
                                                            onClick={() => handleEditClick(fee)}
                                                            disabled={fee.status === "PAID"}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-md">
                                                        <DialogHeader>
                                                            <DialogTitle>Edit Fee Details</DialogTitle>
                                                            <DialogDescription>
                                                                Select fields you want to update for {fee.user.name}
                                                            </DialogDescription>
                                                        </DialogHeader>

                                                        {selectedFields.size === 0 ? (
                                                            <div className="space-y-4">
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {EDITABLE_FIELDS.map((field) => (
                                                                        <Button
                                                                            key={field.key}
                                                                            variant="outline"
                                                                            className={cn(
                                                                                "justify-start",
                                                                                selectedFields.has(field.key) && "border-primary"
                                                                            )}
                                                                            onClick={() => {
                                                                                const newFields = new Set(selectedFields)
                                                                                if (newFields.has(field.key)) {
                                                                                    newFields.delete(field.key)
                                                                                } else {
                                                                                    newFields.add(field.key)
                                                                                }
                                                                                setSelectedFields(newFields)
                                                                            }}
                                                                            disabled={
                                                                                field.key === 'amount' && fee.payments.length > 0 ||
                                                                                fee.status === "PAID"
                                                                            }
                                                                        >
                                                                            <span className="mr-2">
                                                                                {selectedFields.has(field.key) ? "✓" : ""}
                                                                            </span>
                                                                            {field.label}
                                                                        </Button>
                                                                    ))}
                                                                </div>
                                                                {selectedFields.size > 0 && (
                                                                    <Button
                                                                        className="w-full mt-4"
                                                                        onClick={() => {
                                                                            // Continue to edit
                                                                        }}
                                                                    >
                                                                        Continue to Edit
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <ScrollArea className="max-h-[80vh] px-1">
                                                                <form onSubmit={handleSubmit(onSubmitUpdate)} className="space-y-4">
                                                                    {selectedFields.has('title') && (
                                                                        <div>
                                                                            <Label htmlFor="editTitle">Title</Label>
                                                                            <Input
                                                                                id="editTitle"
                                                                                defaultValue={editFormData?.title}
                                                                                {...register("title")}
                                                                                className="mt-1"
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {selectedFields.has('amount') && (
                                                                        <div>
                                                                            <Label htmlFor="editAmount">Amount</Label>
                                                                            <Input
                                                                                id="editAmount"
                                                                                type="number"
                                                                                defaultValue={editFormData?.amount}
                                                                                {...register("amount", { min: 0 })}
                                                                                className="mt-1"
                                                                                disabled={fee.payments.length > 0}
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {selectedFields.has('dueDate') && (
                                                                        <div>
                                                                            <Label htmlFor="editDueDate">Due Date</Label>
                                                                            <Popover>
                                                                                <PopoverTrigger asChild>
                                                                                    <Button
                                                                                        variant={"outline"}
                                                                                        className={cn(
                                                                                            "w-full justify-start text-left font-normal mt-1",
                                                                                            !editDate && "text-muted-foreground"
                                                                                        )}
                                                                                    >
                                                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                                                        {editDate ? format(editDate, "PPP") :
                                                                                            fee.dueDate ? format(new Date(fee.dueDate), "PPP") :
                                                                                                <span>Pick a date</span>}
                                                                                    </Button>
                                                                                </PopoverTrigger>
                                                                                <PopoverContent className="w-auto p-0" align="start">
                                                                                    <Calendar
                                                                                        mode="single"
                                                                                        selected={editDate}
                                                                                        onSelect={(date) => {
                                                                                            handleEditDateSelect(date);
                                                                                            // Also update the form value
                                                                                            if (date) {
                                                                                                const formattedDate = format(date, "yyyy-MM-dd");
                                                                                                register("dueDate").onChange({
                                                                                                    target: { value: formattedDate }
                                                                                                });
                                                                                            }
                                                                                        }}
                                                                                        initialFocus
                                                                                    />
                                                                                </PopoverContent>
                                                                            </Popover>
                                                                        </div>
                                                                    )}

                                                                    {selectedFields.has('type') && (
                                                                        <div>
                                                                            <Label htmlFor="editType">Type</Label>
                                                                            <Controller
                                                                                name="type"
                                                                                control={control}
                                                                                defaultValue={editFormData?.type}
                                                                                render={({ field }) => (
                                                                                    <Select
                                                                                        onValueChange={field.onChange}
                                                                                        defaultValue={field.value}
                                                                                    >
                                                                                        <SelectTrigger className="mt-1">
                                                                                            <SelectValue placeholder="Select fee type" />
                                                                                        </SelectTrigger>
                                                                                        <SelectContent>
                                                                                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                                                                                            <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                                                                                            <SelectItem value="YEARLY">Yearly</SelectItem>
                                                                                            <SelectItem value="ONETIME">One-time</SelectItem>
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                )}
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {selectedFields.has('description') && (
                                                                        <div>
                                                                            <Label htmlFor="editDescription">Description</Label>
                                                                            <Input
                                                                                id="editDescription"
                                                                                defaultValue={editFormData?.description}
                                                                                {...register("description")}
                                                                                className="mt-1"
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {selectedFields.has('lateFeeDate') && (
                                                                        <div>
                                                                            <Label htmlFor="editLateFeeDate">Late Fee Date</Label>
                                                                            <Popover>
                                                                                <PopoverTrigger asChild>
                                                                                    <Button
                                                                                        variant={"outline"}
                                                                                        className={cn(
                                                                                            "w-full justify-start text-left font-normal mt-1",
                                                                                            !editLateFeeDate && "text-muted-foreground"
                                                                                        )}
                                                                                    >
                                                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                                                        {editLateFeeDate ? format(editLateFeeDate, "PPP") :
                                                                                            fee.lateFeeDate ? format(new Date(fee.lateFeeDate), "PPP") :
                                                                                                <span>Pick a date</span>}
                                                                                    </Button>
                                                                                </PopoverTrigger>
                                                                                <PopoverContent className="w-auto p-0" align="start">
                                                                                    <Calendar
                                                                                        mode="single"
                                                                                        selected={editLateFeeDate}
                                                                                        onSelect={handleEditLateFeeSelect}
                                                                                        initialFocus
                                                                                    />
                                                                                </PopoverContent>
                                                                            </Popover>
                                                                        </div>
                                                                    )}

                                                                    {selectedFields.has('lateFeeAmount') && (
                                                                        <div>
                                                                            <Label htmlFor="editLateFeeAmount">Late Fee Amount</Label>
                                                                            <Input
                                                                                id="editLateFeeAmount"
                                                                                type="number"
                                                                                defaultValue={editFormData?.lateFeeAmount}
                                                                                {...register("lateFeeAmount", { min: 0 })}
                                                                                className="mt-1"
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    <DialogFooter className="mt-6">
                                                                        <Button type="button" variant="outline" onClick={() => {
                                                                            setIsDialogOpen(false);
                                                                            setEditDate(undefined);
                                                                            setEditLateFeeDate(undefined);
                                                                        }}>
                                                                            Cancel
                                                                        </Button>

                                                                        <Button type="submit" disabled={isSubmitting}>
                                                                            {isSubmitting ? "Updating..." : "Update Fee"}
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </form>
                                                            </ScrollArea>
                                                        )}
                                                    </DialogContent>
                                                </Dialog>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="destructive"
                                                            disabled={fee.payments.length > 0 || fee.status === "PAID"}
                                                        >
                                                            <Trash className="h-4 w-4" />

                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the fee.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteFee(fee.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>


                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="add-fee">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Fee</CardTitle>
                            <CardDescription>Create a new fee for a student</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(handleAddFee)} className="space-y-4">
                                <div>
                                    <Label htmlFor="userId">Student *</Label>
                                    <Controller
                                        name="userId"
                                        control={control}
                                        rules={{ required: "Student selection is required" }}
                                        render={({ field, fieldState: { error } }) => (
                                            <div>
                                                <Select onValueChange={field.onChange}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a student" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {students.map((student) => (
                                                            <SelectItem key={student.id} value={student.id}>
                                                                {student.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {error && <p className="text-sm text-red-500 mt-1">{error.message}</p>}
                                            </div>
                                        )}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        {...register("title", {
                                            required: "Title is required"
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="amount">Amount *</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        {...register("amount", {
                                            required: "Amount is required",
                                            min: { value: 0, message: "Amount must be positive" }
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="dueDate">Due Date *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !createDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {createDate ? format(createDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={createDate}
                                                onSelect={handleCreateDateSelect}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div>
                                    <Label htmlFor="type">Type *</Label>
                                    <Controller
                                        name="type"
                                        control={control}
                                        rules={{ required: "Fee type is required" }}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select fee type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                                                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                                                    <SelectItem value="YEARLY">Yearly</SelectItem>
                                                    <SelectItem value="ONETIME">One-time</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Input id="description" {...register("description")} />
                                </div>
                                <div>
                                    <Label htmlFor="lateFeeDate">Late Fee Date (Optional)</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !createLateFeeDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {createLateFeeDate ? format(createLateFeeDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={createLateFeeDate}
                                                onSelect={handleCreateLateFeeSelect}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div>
                                    <Label htmlFor="lateFeeAmount">Late Fee Amount (Optional)</Label>
                                    <Input
                                        id="lateFeeAmount"
                                        type="number"
                                        {...register("lateFeeAmount", {
                                            min: { value: 0, message: "Late fee amount must be positive" }
                                        })}
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="isOfflineFee"
                                        {...register("isOfflineFee")}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="isOfflineFee">Is Offline Fee (Optional)</Label>
                                </div>
                                <div className="text-sm text-muted-foreground mb-4">
                                    * Required fields
                                </div>
                                <Button type="submit" className="w-full">Add Fee</Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="analytics">
                    <FeeAnalytics />
                </TabsContent>
            </Tabs>
        </div>
    )
}

