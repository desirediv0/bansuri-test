"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { AlertCircle, Loader2, RefreshCw, MailOpen, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/helper/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface Contact {
    id: string;
    name: string;
    email: string;
    phone: string;
    subject: string | null;
    message: string;
    createdAt: string;
    updatedAt: string;
}

// Define API response interface
interface ApiResponse {
    success: boolean;
    data?: Contact[];
    message?: string;
}

export default function ContactMessages() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const { toast } = useToast();
    const { checkAuth } = useAuth();

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const contactsPerPage = 15;

    const fetchContacts = async () => {
        setError(null);
        setIsRefreshing(true);

        try {
            const isAuth = await checkAuth();
            if (!isAuth) {
                setError("Authentication failed. Please log in again.");
                return;
            }

            const response = await axios.get<ApiResponse>(
                `${process.env.NEXT_PUBLIC_API_URL}/contact/get-all`
            );

            if (response.data.success && response.data.data) {
                setContacts(response.data.data);
            } else {
                setError(response.data.message || "Failed to fetch contact messages");
                toast({
                    title: "Error",
                    description: "Failed to fetch contact messages",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error fetching contacts:", error);
            setError("Network error. Please check your connection and try again.");
            toast({
                title: "Error",
                description: "Failed to fetch contact messages",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    // Get current contacts for pagination
    const indexOfLastContact = currentPage * contactsPerPage;
    const indexOfFirstContact = indexOfLastContact - contactsPerPage;
    const currentContacts = contacts.slice(indexOfFirstContact, indexOfLastContact);
    const totalPages = Math.ceil(contacts.length / contactsPerPage);

    const handleRefresh = () => {
        fetchContacts();
    };

    const renderPaginationItems = () => {
        const items = [];

        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - 1 && i <= currentPage + 1)
            ) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink
                            isActive={i === currentPage}
                            onClick={() => setCurrentPage(i)}
                        >
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationEllipsis />
                    </PaginationItem>
                );
            }
        }

        return items;
    };

    if (loading) {
        return (
            <div className="container mx-auto py-10 px-4 sm:px-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 sm:px-6">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl">Contact Messages</CardTitle>
                        <CardDescription>
                            View and manage all contact form submissions
                        </CardDescription>
                    </div>
                    <Button
                        onClick={handleRefresh}
                        variant="outline"
                        disabled={isRefreshing}
                        className="shrink-0"
                    >
                        {isRefreshing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <Alert variant="destructive" className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : null}

                    <div className="overflow-x-auto">
                        <Table>
                            <TableCaption>A list of all contact form submissions</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[100px]">Name</TableHead>
                                    <TableHead className="min-w-[150px]">Email</TableHead>
                                    <TableHead className="min-w-[120px] hidden sm:table-cell">Phone</TableHead>
                                    <TableHead className="min-w-[150px] hidden md:table-cell">Subject</TableHead>
                                    <TableHead className="min-w-[120px] hidden sm:table-cell">Date</TableHead>
                                    <TableHead className="min-w-[100px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentContacts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-6">
                                            <div className="flex flex-col items-center space-y-2">
                                                <MailOpen className="h-8 w-8 text-muted-foreground" />
                                                <p className="text-muted-foreground">No contact messages found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentContacts.map((contact) => (
                                        <TableRow key={contact.id}>
                                            <TableCell className="font-medium">{contact.name}</TableCell>
                                            <TableCell>{contact.email}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{contact.phone}</TableCell>
                                            <TableCell className="hidden md:table-cell">{contact.subject || "N/A"}</TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                {format(new Date(contact.createdAt), "MMM dd, yyyy")}
                                            </TableCell>
                                            <TableCell>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                                            View
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-xl">Contact Message</DialogTitle>
                                                            <DialogDescription>
                                                                From: {contact.name}
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid gap-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <MailOpen className="h-4 w-4 text-muted-foreground" />
                                                                <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:underline">
                                                                    {contact.email}
                                                                </a>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                                <a href={`tel:${contact.phone}`} className="text-sm text-blue-600 hover:underline">
                                                                    {contact.phone}
                                                                </a>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-lg mb-2">
                                                                    {contact.subject || "No Subject"}
                                                                </h4>
                                                                <div className="bg-muted p-4 rounded-md">
                                                                    <p className="text-sm whitespace-pre-wrap">
                                                                        {contact.message}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                Received on:{" "}
                                                                {format(new Date(contact.createdAt), "PPpp")}
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <DialogClose asChild>
                                                                <Button variant="outline">Close</Button>
                                                            </DialogClose>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                {contacts.length > contactsPerPage && (
                    <CardFooter>
                        <Pagination className="w-full">
                            <PaginationContent>
                                <PaginationItem>
                                    {currentPage > 1 ? (
                                        <PaginationPrevious
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            className="cursor-pointer"
                                        />
                                    ) : (
                                        <PaginationPrevious className="pointer-events-none opacity-50" />
                                    )}
                                </PaginationItem>
                                {renderPaginationItems()}
                                <PaginationItem>
                                    {currentPage < totalPages ? (
                                        <PaginationNext
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            className="cursor-pointer"
                                        />
                                    ) : (
                                        <PaginationNext className="pointer-events-none opacity-50" />
                                    )}
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
