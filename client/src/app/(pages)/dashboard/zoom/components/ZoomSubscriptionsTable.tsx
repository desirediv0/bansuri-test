"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
    name: string;
    email: string;
}

interface ZoomSession {
    title: string;
}

interface Subscription {
    id: string;
    user: User;
    zoomSession: ZoomSession;
    startDate: string;
    endDate: string;
    nextPaymentDate: string;
    status: "ACTIVE" | "CANCELLED" | "EXPIRED";
}

export default function ZoomSubscriptionsTable() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/zoom/admin/subscriptions`,
                { withCredentials: true }
            );
            setSubscriptions(response.data.data);
        } catch (error) {
            console.error("Error fetching subscriptions:", error);
            toast({
                title: "Error",
                description: "Failed to load subscriptions. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelSubscription = async (id: string) => {
        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/zoom/admin/cancel-subscription/${id}`,
                {},
                { withCredentials: true }
            );
            toast({
                title: "Success",
                description: "Subscription cancelled successfully",
            });
            fetchSubscriptions();
            setSelectedSubscription(null);
        } catch (error) {
            console.error("Error cancelling subscription:", error);
            toast({
                title: "Error",
                description: "Failed to cancel subscription",
                variant: "destructive",
            });
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Session</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Next Payment</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subscriptions.length > 0 ? (
                            subscriptions.map((subscription) => (
                                <TableRow key={subscription.id}>
                                    <TableCell>
                                        {subscription.user.name}
                                        <div className="text-xs text-muted-foreground">{subscription.user.email}</div>
                                    </TableCell>
                                    <TableCell>{subscription.zoomSession.title}</TableCell>
                                    <TableCell>{formatDate(subscription.startDate)}</TableCell>
                                    <TableCell>{formatDate(subscription.endDate)}</TableCell>
                                    <TableCell>{formatDate(subscription.nextPaymentDate)}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded text-xs ${subscription.status === "ACTIVE"
                                            ? "bg-green-100 text-green-800"
                                            : subscription.status === "CANCELLED"
                                                ? "bg-amber-100 text-amber-800"
                                                : "bg-red-100 text-red-800"
                                            }`}>
                                            {subscription.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {subscription.status === "ACTIVE" && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedSubscription(subscription)}
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    No subscriptions found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Cancel Confirmation Dialog */}
            {selectedSubscription && (
                <Dialog open={!!selectedSubscription} onOpenChange={() => setSelectedSubscription(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Cancellation</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to cancel this subscription? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedSubscription(null)}>
                                No, Keep It
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => handleCancelSubscription(selectedSubscription.id)}
                            >
                                Yes, Cancel Subscription
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
