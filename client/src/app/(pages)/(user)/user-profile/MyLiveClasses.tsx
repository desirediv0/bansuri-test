"use client";
// At the beginning of the file, before imports

declare global {
  interface Window {
    Razorpay: any;
  }
}

import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// UI Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";

// Icons
import {
  Calendar,
  Clock,
  ExternalLink,
  RefreshCw,
  User,
  VideoIcon,
  Loader2,
  CreditCard,
  Video,
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
  hasModules: boolean;
  moduleName?: string;
  registrationFee: number;
  courseFee: number;
  currentRange?: string;
  currentOrientation?: string;
}

interface Subscription {
  id: string;
  startDate: string;
  endDate: string;
  status:
    | "ACTIVE"
    | "EXPIRED"
    | "CANCELLED"
    | "PENDING_APPROVAL"
    | "REGISTERED"
    | "REJECTED";
  isApproved: boolean;
  isRegistered: boolean;
  hasAccessToLinks: boolean;
  lastPaymentDate: string;
  nextPaymentDate: string;
  zoomSession: ZoomSession;
  moduleId?: string;
  registrationPaymentId: string | null;
}

const MyLiveClasses = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [coursePaymentInProgress, setCoursePaymentInProgress] = useState<
    string | null
  >(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = () => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        console.log("Razorpay script loaded successfully");
        setRazorpayLoaded(true);
      };
      script.onerror = () => {
        console.error("Failed to load Razorpay script");
        toast.error("Payment system failed to load. Please refresh the page.");
      };
      document.body.appendChild(script);
    };

    loadRazorpay();

    // Cleanup function
    return () => {
      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/my-subscriptions`,
        { withCredentials: true }
      );
      console.log("Fetched subscriptions:", response.data.data);

      // Check for subscriptions that should be active but aren't showing correctly
      const potentialIssues = response.data.data.filter(
        (sub: Subscription) =>
          sub.status === "ACTIVE" && sub.isApproved && !sub.hasAccessToLinks
      );

      if (potentialIssues.length > 0) {
        console.log(
          "Found approved subscriptions without access:",
          potentialIssues
        );
      }

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
    if (!selectedSubscription) return;

    try {
      setLoading(true);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/cancel-subscription/${selectedSubscription?.id}`,
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

  const handleJoinClass = async (zoomSessionId: string, moduleId?: string) => {
    try {
      setLoading(true);
      let queryParams = moduleId ? `?moduleId=${moduleId}` : "";

      // Note: The server expects zoomLiveClassId as the parameter, but we're using zoomSessionId from client
      // This is fine because the IDs are the same, just with different names in client vs server models
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/check-subscription/${zoomSessionId}${queryParams}`,
        { withCredentials: true }
      );

      console.log("Join class response:", response.data);

      if (response.data.data.isSubscribed) {
        window.open(response.data.data.meetingDetails.link, "_blank");
      } else if (response.data.data.isPending) {
        toast.error(
          "Your subscription is still pending approval from the administrator."
        );
      } else if (!response.data.data.isApproved) {
        toast.error(
          "Your subscription has not been approved yet. Please wait for admin approval."
        );
      } else {
        toast.error("Access Denied. Your subscription may have expired.");
      }
    } catch (error) {
      console.error("Error joining class:", error);
      toast.error("Failed to join the class. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayCourseAccess = async (subscription: Subscription) => {
    try {
      setCoursePaymentInProgress(subscription.id);

      // Check if course fee payment is already done
      if (subscription.hasAccessToLinks) {
        toast.info("You have already paid the course fee");
        return;
      }

      // Ensure Razorpay is loaded
      if (!razorpayLoaded || typeof window.Razorpay === "undefined") {
        toast.error(
          "Payment gateway not loaded. Please refresh the page and try again."
        );
        return;
      }

      console.log(
        "Initiating course access payment for class:",
        subscription.zoomSession.id,
        "subscription:",
        subscription.id
      );

      // Create course access payment
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/pay-course-access`,
        {
          zoomLiveClassId: subscription.zoomSession.id,
        },
        { withCredentials: true }
      );

      // If user already has access
      if (response.data.data.alreadyHasAccess) {
        toast.success("You already have access to this class");
        fetchSubscriptions();
        return;
      }

      // Get Razorpay Key from server
      const keyResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/payment/getpublickey`
      );
      const key = keyResponse.data.key;

      // Initialize Razorpay
      const options = {
        key: key,
        amount: response.data.data.order.amount,
        currency: response.data.data.order.currency,
        name: "Bansuri Vidya Mandir | Indian Classical Music Institute",
        description: `Course Access for: ${subscription.zoomSession.title}`,
        order_id: response.data.data.order.id,
        image: "/logo-black.png",
        handler: async function (response: any) {
          try {
            console.log("Payment successful, verifying with params:", {
              zoomLiveClassId: subscription.zoomSession.id,
            });

            // Verify payment
            const verifyResponse = await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/verify-course-access`,
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                zoomLiveClassId: subscription.zoomSession.id,
              },
              { withCredentials: true }
            );

            console.log("Payment verification result:", verifyResponse.data);
            toast.success("Course access payment successful!");
            fetchSubscriptions(); // Refresh the list
          } catch (error) {
            console.error("Payment verification failed:", error);
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#af1d33",
        },
      };

      // Create and open Razorpay
      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response.error);
        toast.error(`Payment failed: ${response.error.description}`);
      });
      razorpay.open();
    } catch (error: any) {
      console.error("Error initiating course access payment:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to initiate payment. Please try again."
      );
    } finally {
      setCoursePaymentInProgress(null);
    }
  };

  const isUpcoming = (startTime: string) => {
    return new Date(startTime) > new Date();
  };

  const getStatusBadgeColor = (
    status: string,
    isApproved: boolean,
    isRegistered: boolean,
    hasAccessToLinks: boolean
  ) => {
    if (status === "ACTIVE" && isApproved && hasAccessToLinks)
      return "bg-green-100 text-green-800";
    if (status === "ACTIVE" && isApproved) return "bg-blue-100 text-blue-800";
    if (status === "PENDING_APPROVAL") return "bg-yellow-100 text-yellow-800";
    if (status === "REJECTED") return "bg-red-100 text-red-800";
    if (status === "CANCELLED") return "bg-gray-100 text-gray-800";
    return "bg-red-100 text-red-800";
  };

  const getStatusText = (
    status: string,
    isApproved: boolean,
    isRegistered: boolean,
    hasAccessToLinks: boolean
  ) => {
    if (status === "ACTIVE" && isApproved && hasAccessToLinks)
      return "Full Access";
    if (status === "ACTIVE" && isApproved) return "Approved (Need Course Fee)";
    if (status === "PENDING_APPROVAL") return "Pending Approval";
    if (status === "REJECTED") return "Rejected";
    if (status === "CANCELLED") return "Cancelled";
    return status;
  };

  const defaultThumbnail = "/images/default-class-thumbnail.jpg";

  // Filter upcoming classes
  const upcomingClasses = subscriptions.filter((sub) =>
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
          <p className="text-gray-600">
            You haven't subscribed to any live classes yet.
          </p>
          <Button
            className="mt-4 bg-red-600 hover:bg-red-700"
            onClick={() => router.push("/live-classes")}
          >
            Browse Live Classes
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id} className="overflow-hidden">
              <div className="relative h-40 w-full">
                <Image
                  src={
                    subscription.zoomSession.thumbnailUrl || defaultThumbnail
                  }
                  alt={subscription.zoomSession.title}
                  fill
                  style={{ objectFit: "cover" }}
                />
                <div
                  className={`absolute top-0 right-0 ${getStatusBadgeColor(
                    subscription.status,
                    subscription.isApproved,
                    subscription.isRegistered,
                    subscription.hasAccessToLinks
                  )}`}
                >
                  {getStatusText(
                    subscription.status,
                    subscription.isApproved,
                    subscription.isRegistered,
                    subscription.hasAccessToLinks
                  )}
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-2">
                  {subscription.zoomSession.title}
                  {subscription.zoomSession.moduleName && (
                    <span className="text-sm text-gray-600 block">
                      Module: {subscription.zoomSession.moduleName}
                    </span>
                  )}
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
                {subscription.status === "PENDING_APPROVAL" && (
                  <div className="text-sm text-yellow-600 font-semibold flex items-center">
                    <span className="animate-pulse">● </span>
                    <span className="ml-1">Waiting for admin approval</span>
                  </div>
                )}
                {subscription.zoomSession.currentRange && (
                  <div className="flex items-center text-sm">
                    <span className="font-medium">Range:</span>
                    <span className="ml-1">
                      {subscription.zoomSession.currentRange}
                    </span>
                  </div>
                )}
                {subscription.zoomSession.currentOrientation && (
                  <div className="flex items-center text-sm">
                    <span className="font-medium">Orientation:</span>
                    <span className="ml-1">
                      {subscription.zoomSession.currentOrientation}
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                {!subscription.hasAccessToLinks && (
                  <Button
                    variant="default"
                    size="sm"
                    disabled={
                      coursePaymentInProgress === subscription.id ||
                      subscription.status !== "ACTIVE" ||
                      !subscription.isApproved
                    }
                    onClick={() => handlePayCourseAccess(subscription)}
                    className="w-full sm:w-auto"
                    title={
                      !subscription.isApproved
                        ? "Waiting for admin approval"
                        : "Pay course fee to access class links"
                    }
                  >
                    {coursePaymentInProgress === subscription.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-1" />
                    )}
                    {subscription.isApproved
                      ? "Pay Course Fee"
                      : "Waiting for Approval"}
                  </Button>
                )}

                {subscription.hasAccessToLinks && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() =>
                      handleJoinClass(
                        subscription.zoomSession.id,
                        subscription.moduleId
                      )
                    }
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Join Class
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={() => handleCancelIntent(subscription)}
                >
                  Cancel
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
    </section>
  );
};

export default MyLiveClasses;
