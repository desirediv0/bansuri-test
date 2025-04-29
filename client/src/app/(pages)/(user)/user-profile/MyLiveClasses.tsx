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
  CheckCircle2,
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
  courseFeeEnabled: boolean;
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
  const [isJoining, setIsJoining] = useState(false);
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

      // Check for subscriptions that should be active but aren't showing correctly
      const potentialIssues = response.data.data.filter(
        (sub: Subscription) =>
          sub.status === "ACTIVE" && sub.isApproved && !sub.hasAccessToLinks
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

  const handleJoinClass = async (id?: string, moduleId?: string) => {
    try {
      setIsJoining(true);
      let queryParams = moduleId ? `?moduleId=${moduleId}` : "";

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/check-subscription/${id}${queryParams}`,
        { withCredentials: true }
      );

      if (
        response.data.data.hasAccessToLinks &&
        response.data.data.meetingDetails?.link
      ) {
        window.open(response.data.data.meetingDetails.link, "_blank");
      } else {
        toast.error(
          "Unable to join class. Please check your registration status."
        );
      }
    } catch (error) {
      console.error("Error joining class:", error);
      toast.error("Failed to join the class. Please try again.");
    } finally {
      setIsJoining(false);
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

  const getStatusBadge = (subscription: any) => {
    if (subscription.hasAccessToLinks) {
      return {
        text: "Full Access",
        className: "bg-green-500 text-white",
      };
    }

    if (subscription.status === "CANCELLED") {
      return {
        text: "Cancelled",
        className: "bg-gray-100 text-gray-800",
      };
    }

    if (subscription.status === "REJECTED") {
      return {
        text: "Rejected",
        className: "bg-red-100 text-red-800",
      };
    }

    // If registered and course fee is not enabled, show ready to join
    if (
      subscription.isRegistered &&
      !subscription.zoomSession.courseFeeEnabled
    ) {
      return {
        text: "Ready to Join",
        className: "bg-green-100 text-green-800",
      };
    }

    // If registered and course fee is enabled, show course fee required
    if (
      subscription.isRegistered &&
      subscription.zoomSession.courseFeeEnabled
    ) {
      return {
        text: "Course Fee Required",
        className: "bg-blue-100 text-blue-800",
      };
    }

    return {
      text: "Registration Pending",
      className: "bg-yellow-100 text-yellow-800",
    };
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <VideoIcon className="h-6 w-6 text-[#af1d33]" />
          My Live Classes
        </h2>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 hover:bg-gray-100 transition-colors"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {subscriptions.length === 0 ? (
        <Card className="col-span-full p-8 text-center border-dashed border-2 border-red-200 bg-red-50/50">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Live Classes Yet
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't subscribed to any live classes. Join a class to start
              learning from our expert instructors.
            </p>
            <Button
              className="bg-gradient-to-r from-[#af1d33] to-[#8f1729] hover:from-[#8f1729] hover:to-[#af1d33] text-white shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => router.push("/live-classes")}
            >
              Browse Live Classes
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map((subscription) => (
            <Card
              key={subscription.id}
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="relative h-48 w-full">
                <Image
                  src={
                    subscription.zoomSession.thumbnailUrl || defaultThumbnail
                  }
                  alt={subscription.zoomSession.title}
                  fill
                  style={{ objectFit: "cover" }}
                  className="transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute top-4 right-4">
                  {(() => {
                    const status = getStatusBadge(subscription);
                    return (
                      <Badge
                        className={`px-3 py-1.5 text-sm font-medium shadow-sm ${status.className}`}
                      >
                        {status.text}
                      </Badge>
                    );
                  })()}
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-2">
                  {subscription.zoomSession.title}
                  {subscription.zoomSession.moduleName && (
                    <span className="text-sm text-gray-600 block mt-1">
                      Module: {subscription.zoomSession.moduleName}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="mr-2 h-4 w-4 text-[#af1d33]" />
                  <span>{subscription.zoomSession.teacherName}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="mr-2 h-4 w-4 text-[#af1d33]" />
                  <span>{subscription.zoomSession.formattedDate}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="mr-2 h-4 w-4 text-[#af1d33]" />
                  <span>{subscription.zoomSession.formattedTime}</span>
                </div>
                {subscription.isRegistered &&
                  !subscription.hasAccessToLinks && (
                    <div className="text-sm font-medium flex items-center bg-gray-50 p-2 rounded-lg">
                      {subscription.zoomSession.courseFeeEnabled ? (
                        <>
                          <CreditCard className="h-4 w-4 text-blue-600 mr-2" />
                          <span className="text-blue-800">
                            Please pay the course fee to access class links
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                          <span className="text-green-800">
                            You can now join the live class
                          </span>
                        </>
                      )}
                    </div>
                  )}
                {subscription.zoomSession.currentRange && (
                  <div className="flex items-center text-sm bg-gray-50 p-2 rounded-lg">
                    <span className="font-medium text-gray-700">Range:</span>
                    <span className="ml-2 text-gray-600">
                      {subscription.zoomSession.currentRange}
                    </span>
                  </div>
                )}
                {subscription.zoomSession.currentOrientation && (
                  <div className="flex items-center text-sm bg-gray-50 p-2 rounded-lg">
                    <span className="font-medium text-gray-700">
                      Orientation:
                    </span>
                    <span className="ml-2 text-gray-600">
                      {subscription.zoomSession.currentOrientation}
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2 pt-2 pb-4">
                {subscription.isRegistered ? (
                  subscription.hasAccessToLinks ||
                  !subscription.zoomSession.courseFeeEnabled ? (
                    // Show Join button if has access or course fee is not required
                    <Button
                      variant="default"
                      onClick={() =>
                        handleJoinClass(
                          subscription.zoomSession.id,
                          subscription.moduleId
                        )
                      }
                      disabled={isJoining}
                      className="w-full py-5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isJoining ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <Video className="h-5 w-5 mr-2" />
                      )}
                      {isJoining ? "Joining..." : "Join Live Class"}
                    </Button>
                  ) : (
                    // Show Pay Course Fee button if course fee is required
                    <Button
                      variant="default"
                      disabled={coursePaymentInProgress === subscription.id}
                      onClick={() => handlePayCourseAccess(subscription)}
                      className="w-full py-5 bg-gradient-to-r from-[#af1d33] to-[#8f1729] hover:from-[#8f1729] hover:to-[#af1d33] text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {coursePaymentInProgress === subscription.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5 mr-2" />
                          Pay Course Fee
                        </>
                      )}
                    </Button>
                  )
                ) : null}

                <Button
                  variant="outline"
                  className="flex items-center hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
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
        <AlertDialogContent className="bg-white rounded-xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">
              Cancel Subscription
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 mt-2">
              Are you sure you want to cancel your subscription to this class?
              You will no longer have access to join it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="hover:bg-gray-100 transition-colors">
              Keep Subscription
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className="bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default MyLiveClasses;
