"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Icons
import {
    Calendar,
    Clock,
    ExternalLink,
    RefreshCw,
    Trash2,
    User,
    VideoIcon,
} from "lucide-react";

// Types
interface ZoomSession {
    id: string;
    title: string;
    teacherName: string;
    startTime: string;
    endTime: string;
    formattedDate: string;
    formattedTime: string;
    thumbnailUrl: string | null;
    duration: number;
    zoomLink: string;
}

interface Subscription {
    id: string;
    startDate: string;
    endDate: string;
    status: "ACTIVE" | "EXPIRED";
    lastPaymentDate: string;
    nextPaymentDate: string;
    zoomSession: ZoomSession;
}

const MyLiveClasses = () => {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/zoom/my-subscriptions`,
                { withCredentials: true }
            );
            setSubscriptions(response.data.data);
        } catch (error) {
            console.error("Error fetching subscriptions:", error);
            toast.error("Failed to load your live classes. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchSubscriptions();
        setRefreshing(false);
    };

    const handleCancelIntent = (subscription: Subscription) => {
        setSelectedSubscription(subscription);
        setCancelDialogOpen(true);
    };

    const handleCancelConfirm = async () => {
        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/zoom/cancel-subscription/${selectedSubscription?.id}`,
                {},
                { withCredentials: true }
            );

            fetchSubscriptions();
            toast.success("Your subscription has been cancelled successfully.");
        } catch (error) {
            console.error("Error cancelling subscription:", error);
            toast.error("Failed to cancel subscription. Please try again.");
        } finally {
            setCancelDialogOpen(false);
        }
    };

    const handleJoinClass = async (zoomSessionId: string) => {
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/zoom/check-subscription/${zoomSessionId}`,
                { withCredentials: true }
            );

            if (response.data.data.isSubscribed) {
                window.open(response.data.data.meetingDetails.link, "_blank");
            } else {
                toast.error("Access Denied. Your subscription may have expired.");
            }
        } catch (error) {
            console.error("Error joining class:", error);
            toast.error("Failed to join the class. Please try again.");
        }
    };

    const isUpcoming = (startTime: string) => {
        return new Date(startTime) > new Date();
    };

    const defaultThumbnail = "/images/default-class-thumbnail.jpg";

    // Filter upcoming classes
    const upcomingClasses = subscriptions.filter(sub =>
        isUpcoming(sub.zoomSession.startTime)
    );

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <VideoIcon className="h-5 w-5 text-red-600" />
                        My Live Classes
                    </h2>
                    <Skeleton className="h-9 w-24" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-64 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <section>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <VideoIcon className="h-5 w-5 text-red-600" />
                    My Live Classes
                </h2>
                <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2"
                >
                    <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                    Refresh
                </Button>
            </div>

            {subscriptions.length === 0 ? (
                <Card className="col-span-full p-8 text-center border-dashed border-2 border-red-200">
                    <p className="text-gray-600">You haven't subscribed to any live classes yet.</p>
                    <Button className="mt-4 bg-red-600 hover:bg-red-700" onClick={() => router.push('/live-classes')}>
                        Browse Live Classes
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subscriptions.map((subscription) => (
                        <Card key={subscription.id} className="overflow-hidden">
                            <div className="relative h-40 w-full">
                                <Image
                                    src={subscription.zoomSession.thumbnailUrl || defaultThumbnail}
                                    alt={subscription.zoomSession.title}
                                    fill
                                    style={{ objectFit: "cover" }}
                                />
                                <div className="absolute top-0 right-0 bg-red-600 text-white px-3 py-1">
                                    {subscription.status}
                                </div>
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg line-clamp-2">
                                    {subscription.zoomSession.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 pb-2">
                                <div className="flex items-center text-sm">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>{subscription.zoomSession.teacherName}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <span>{subscription.zoomSession.formattedDate}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Clock className="mr-2 h-4 w-4" />
                                    <span>{subscription.zoomSession.formattedTime}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                                <Button
                                    className="flex-1 flex items-center gap-2"
                                    onClick={() => handleJoinClass(subscription.zoomSession.id)}
                                >
                                    <ExternalLink size={16} />
                                    Join Class
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex items-center"
                                    onClick={() => handleCancelIntent(subscription)}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel your subscription to this class? You will no longer have access to join it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelConfirm}>
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    );
};

export default MyLiveClasses;
