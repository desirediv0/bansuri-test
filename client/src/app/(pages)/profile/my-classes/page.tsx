"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Calendar,
  Clock,
  ExternalLink,
  Loader2,
  RefreshCw,
  Trash2,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

// Define TypeScript interfaces for our data structures
interface ZoomSession {
  id: string;
  title: string;
  teacherName: string;
  startTime: string;
  formattedDate: string;
  formattedTime: string;
  thumbnailUrl: string | null;
}

interface Subscription {
  id: string;
  zoomSession: ZoomSession;
}

export default function MyClasses() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/my-subscriptions`,
        { withCredentials: true }
      );
      setSubscriptions(response.data.data);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast({
        title: "Error",
        description: "Failed to load your classes. Please try again.",
        variant: "destructive",
      });
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
    if (!selectedSubscription) return;

    try {
      setLoading(true);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/cancel-subscription/${selectedSubscription?.id}`,
        {},
        { withCredentials: true }
      );

      fetchSubscriptions();
      toast({
        title: "Cancelled",
        description: "Your subscription has been cancelled successfully.",
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancelDialogOpen(false);
    }
  };

  const handleJoinClass = async (zoomSessionId: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/check-subscription/${zoomSessionId}`,
        { withCredentials: true }
      );

      if (response.data.data.isSubscribed) {
        window.open(response.data.data.meetingDetails.link, "_blank");
      } else {
        toast({
          title: "Access Denied",
          description: "Your subscription may have expired.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error joining class:", error);
      toast({
        title: "Error",
        description: "Failed to join the class. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isUpcoming = (startTime: string) => {
    return new Date(startTime) > new Date();
  };

  const defaultThumbnail = "/images/default-class-thumbnail.jpg";

  // Filter upcoming and past classes
  const upcomingClasses = subscriptions.filter((sub) =>
    isUpcoming(sub.zoomSession.startTime)
  );

  const pastClasses = subscriptions.filter(
    (sub) => !isUpcoming(sub.zoomSession.startTime)
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Live Classes</h1>
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
        <div className="text-center bg-muted p-8 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">No Classes Found</h2>
          <p className="mb-4">
            You haven't subscribed to any live classes yet.
          </p>
          <Button onClick={() => (window.location.href = "/live-classes")}>
            Browse Available Classes
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">
              Upcoming Classes ({upcomingClasses.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past Classes ({pastClasses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingClasses.length === 0 ? (
                <div className="col-span-full text-center bg-muted p-8 rounded-lg">
                  <p>You don't have any upcoming classes.</p>
                </div>
              ) : (
                upcomingClasses.map((subscription) => (
                  <Card key={subscription.id} className="overflow-hidden">
                    <div className="relative h-40 w-full">
                      <Image
                        src={
                          subscription.zoomSession.thumbnailUrl ||
                          defaultThumbnail
                        }
                        alt={subscription.zoomSession.title}
                        layout="fill"
                        objectFit="cover"
                      />
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
                        onClick={() =>
                          handleJoinClass(subscription.zoomSession.id)
                        }
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
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="past">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastClasses.length === 0 ? (
                <div className="col-span-full text-center bg-muted p-8 rounded-lg">
                  <p>You don't have any past classes.</p>
                </div>
              ) : (
                pastClasses.map((subscription) => (
                  <Card
                    key={subscription.id}
                    className="overflow-hidden opacity-75"
                  >
                    <div className="relative h-40 w-full">
                      <Image
                        src={
                          subscription.zoomSession.thumbnailUrl ||
                          defaultThumbnail
                        }
                        alt={subscription.zoomSession.title}
                        layout="fill"
                        objectFit="cover"
                      />
                      <div className="absolute top-0 right-0 bg-black/60 text-white px-3 py-1">
                        Completed
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
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription to this class?
              You will no longer have access to join it.
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
    </div>
  );
}
