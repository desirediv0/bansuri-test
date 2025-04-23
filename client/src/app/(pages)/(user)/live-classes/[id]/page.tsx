"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Users,
  Info,
  Share2,
  Loader2,
  CheckCircle2,
  IndianRupee,
  Check,
  Video,
  Copy,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/helper/AuthContext";
import PurchaseDialog from "../components/PurchaseDialog";
import RegistrationDialog from "../components/RegistrationDialog";
import CourseAccessDialog from "../components/CourseAccessDialog";
import { HeroSection } from "@/app/(pages)/_components/HeroSectionProps";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function ClassDetails() {
  const params = useParams();

  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [showCourseAccessDialog, setShowCourseAccessDialog] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasAccessToLinks, setHasAccessToLinks] = useState(false);
  const [apiChecksCompleted, setApiChecksCompleted] = useState({
    fetchClassDetails: false,
    checkSubscription: false,
    checkPaymentStatus: false,
  });

  useEffect(() => {
    if (id) {
      setApiChecksCompleted({
        fetchClassDetails: false,
        checkSubscription: false,
        checkPaymentStatus: false,
      });

      fetchClassDetails();

      if (isAuthenticated) {
        checkSubscriptionStatus();
        checkPaymentStatus();
      }
    } else {
      toast({
        title: "Error",
        description: "No class ID found. Redirecting to classes list.",
        variant: "destructive",
      });
      setTimeout(() => router.push("/live-classes"), 3000);
    }
  }, [id, isAuthenticated]);

  const determineUserStatus = () => {
    const userIsRegistered =
      isRegistered || (classData && classData.isRegistered);

    const userHasAccess =
      hasAccessToLinks || (classData && classData.hasAccessToLinks);

    return { userIsRegistered, userHasAccess };
  };

  const fetchClassDetails = async () => {
    try {
      setLoading(true);
      console.log("Fetching class details...");

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom/session/${id}`
      );

      const classData = response.data.data;

      if (classData.startTime) {
        const startDate = new Date(classData.startTime);
        classData.formattedDate = startDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        classData.formattedTime = startDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      }

      console.log(
        "Class details fetched, reg status:",
        classData.isRegistered,
        "access status:",
        classData.hasAccessToLinks
      );
      setClassData(classData);

      setApiChecksCompleted((prev) => ({ ...prev, fetchClassDetails: true }));
    } catch (error) {
      console.error("Error fetching class details:", error);
      toast({
        title: "Error",
        description: "Failed to load class details. Please try again.",
        variant: "destructive",
      });
      setTimeout(() => router.push("/live-classes"), 3000);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      console.log("Checking subscription status...");

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom/check-subscription/${id}`,
        { withCredentials: true }
      );

      if (response.data.data) {
        const { isSubscribed, isRegistered, hasAccessToLinks, meetingDetails } =
          response.data.data;

        console.log("Subscription check results:", {
          isRegistered,
          hasAccessToLinks,
        });

        setIsRegistered(!!isRegistered);
        setHasAccessToLinks(!!hasAccessToLinks);

        setClassData((prev: any) => {
          if (!prev) return prev;

          return {
            ...prev,
            isSubscribed: !!isSubscribed,
            isRegistered: !!isRegistered,
            hasAccessToLinks: !!hasAccessToLinks,
            ...(hasAccessToLinks && meetingDetails
              ? {
                  zoomLink: meetingDetails.link || prev.zoomLink,
                  zoomMeetingId: meetingDetails.meetingId || prev.zoomMeetingId,
                  zoomPassword: meetingDetails.password || prev.zoomPassword,
                }
              : {}),
          };
        });

        if (response.data.data.reactivated) {
          toast({
            title: "Subscription Reactivated",
            description: "Your previous subscription has been reactivated.",
          });
        }
      }

      setApiChecksCompleted((prev) => ({ ...prev, checkSubscription: true }));
    } catch (error) {
      console.error("Error checking subscription status:", error);
      setApiChecksCompleted((prev) => ({ ...prev, checkSubscription: true }));
    }
  };

  const checkPaymentStatus = async () => {
    try {
      console.log("Checking payment status...");

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom/check-payment-status/${id}`,
        { withCredentials: true }
      );

      const { hasRegistered, hasPaidCourseFee } = response.data.data;

      console.log("Payment status results:", {
        hasRegistered,
        hasPaidCourseFee,
      });

      setIsRegistered(!!hasRegistered);
      setHasAccessToLinks(!!hasPaidCourseFee);

      setClassData((prev: any) => {
        if (!prev) return prev;

        return {
          ...prev,
          isRegistered: !!hasRegistered,
          hasAccessToLinks: !!hasPaidCourseFee,
        };
      });

      if (hasPaidCourseFee) {
        router.push("/user-profile");
        toast({
          title: "Already Paid",
          description:
            "You've already paid for this class. View details in your profile.",
        });
      }

      setApiChecksCompleted((prev) => ({ ...prev, checkPaymentStatus: true }));
    } catch (error) {
      console.error("Error checking payment status:", error);
      setApiChecksCompleted((prev) => ({ ...prev, checkPaymentStatus: true }));
    }
  };

  const handleJoinClass = async (id?: string, isModule: boolean = false) => {
    if (!isAuthenticated) {
      router.push(
        `/auth?redirect=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    try {
      setIsJoining(true);
      let targetId = id || classData.id;
      let queryParams = "";

      if (isModule && id) {
        queryParams = `?moduleId=${id}`;
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom/check-subscription/${classData.id}${queryParams}`,
        { withCredentials: true }
      );

      if (response.data.data.isSubscribed) {
        window.open(response.data.data.meetingDetails.link, "_blank");
      } else if (response.data.data.isPending) {
        toast({
          title: "Pending Approval",
          description:
            "Your subscription is pending approval from the administrator.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Access Denied",
          description: "You need to purchase this class to join.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      toast({
        title: "Error",
        description: "Failed to join the class. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handlePurchase = () => {
    if (!isAuthenticated) {
      router.push(
        `/auth?redirect=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    const { userIsRegistered, userHasAccess } = determineUserStatus();

    if (userIsRegistered || userHasAccess) {
      toast({
        title: "Already Registered",
        description: userHasAccess
          ? "You already have full access to this class."
          : "You've already registered for this class. Please pay the course fee to access the links.",
      });
      return;
    }

    setShowPurchaseDialog(true);
  };

  const handlePurchaseComplete = () => {
    setShowPurchaseDialog(false);
    fetchClassDetails();
    checkSubscriptionStatus();
    toast({
      title: "Success",
      description: "Class purchased successfully!",
    });
  };

  const handleRegistrationComplete = () => {
    setShowRegistrationDialog(false);
    fetchClassDetails();
    checkSubscriptionStatus();
    toast({
      title: "Success",
      description: "Registration completed successfully!",
    });
  };

  const handleCourseAccessComplete = () => {
    setShowCourseAccessDialog(false);
    fetchClassDetails();
    checkSubscriptionStatus();
    toast({
      title: "Success",
      description: "Course access payment completed successfully!",
    });
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: classData?.title || "Bansuri Live Class",
        text: `Check out this live flute class: ${classData?.title}`,
        url: window.location.href,
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Loader2 className="h-12 w-12 text-primary" />
          </motion.div>
          <p className="mt-4 text-gray-600">Loading class details...</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Class Not Found</h1>
        <p className="mb-8">
          The class you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.push("/live-classes")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Classes
        </Button>
      </div>
    );
  }

  // Determine user status for all UI elements
  const { userIsRegistered, userHasAccess } = determineUserStatus();

  console.log("Final render status:", {
    stateIsRegistered: isRegistered,
    stateHasAccess: hasAccessToLinks,
    classDataIsRegistered: classData?.isRegistered,
    classDataHasAccess: classData?.hasAccessToLinks,
    computedIsRegistered: userIsRegistered,
    computedHasAccess: userHasAccess,
    apiChecks: apiChecksCompleted,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F9FA] to-[#F3F8F8]">
      <HeroSection
        smallText="Live Classes"
        title="Learn from expert instructors in real-time"
        variant="page"
        image={{
          src: "/rupak-sir.webp",
          alt: "Live flute classes",
        }}
      />
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <div className="relative h-64 md:h-96 w-full rounded-xl overflow-hidden mb-6">
              <Image
                src={
                  classData.thumbnailUrl ||
                  "/images/default-class-thumbnail.jpg"
                }
                alt={classData.title}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

              {isAuthenticated && userIsRegistered && (
                <div className="absolute top-4 right-4">
                  <Badge
                    variant="secondary"
                    className="px-3 py-1.5 bg-green-600 text-white font-medium"
                  >
                    Registered
                  </Badge>
                </div>
              )}

              <div className="absolute bottom-4 left-4 right-4">
                <h1 className="text-white text-2xl md:text-4xl font-bold mb-2">
                  {classData.title}
                </h1>
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge
                    variant="outline"
                    className="bg-white/20 backdrop-blur-sm text-white border-white/30"
                  >
                    {classData.category || "Flute"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-white/20 backdrop-blur-sm text-white border-white/30"
                  >
                    {classData.level || "All Levels"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                About This Class
              </h2>
              <p className="text-gray-700 whitespace-pre-line">
                {classData.description ||
                  "No description available for this class."}
              </p>
            </div>

            {classData.hasModules &&
              classData.modules &&
              classData.modules.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                  <h2 className="text-xl font-bold mb-4 text-gray-800">
                    Class Modules
                  </h2>
                  <Accordion type="single" collapsible className="space-y-3">
                    {classData.modules.map((module: any, index: number) => (
                      <AccordionItem
                        key={module.id}
                        value={module.id}
                        className="border rounded-lg overflow-hidden"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                          <div className="flex items-center text-left">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-3">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-semibold text-base">
                                {module.title}
                              </h3>
                              <div className="flex items-center text-gray-500 text-sm mt-1">
                                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                <span>
                                  {new Date(
                                    module.startTime
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                                <Clock className="h-3.5 w-3.5 ml-3 mr-1.5" />
                                <span>
                                  {new Date(
                                    module.startTime
                                  ).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </span>
                              </div>
                            </div>
                            {module.isFree && (
                              <span className="ml-auto mr-4 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                Free
                              </span>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 py-3 bg-gray-50 border-t">
                          <p className="text-gray-700 mb-3">
                            {module.description ||
                              `Session ${index + 1} of this live class series.`}
                          </p>
                          {isAuthenticated && module.isFree && (
                            <Button
                              className="bg-green-600 hover:bg-green-700 text-white mt-2"
                              size="sm"
                              onClick={() => handleJoinClass(module.id, true)}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Join Free Module
                            </Button>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}

            {classData.currentRange && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                  Current Raga
                </h2>
                <p className="text-gray-700">
                  {classData.currentRange ||
                    "No current raga information available."}
                </p>
              </div>
            )}

            {classData.currentOrientation && (
              <div className="bg-white rounded-xl shadow-md p-6 mt-8">
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                  Current Orientation
                </h2>
                <p className="text-gray-700 whitespace-pre-line">
                  {classData.currentOrientation}
                </p>
              </div>
            )}
          </motion.div>

          {/* Right Column - Class Details & CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <div className="mb-6">
                <div className="flex flex-col gap-2">
                  {isAuthenticated &&
                  (isRegistered || classData.isRegistered) ? (
                    hasAccessToLinks || classData.hasAccessToLinks ? (
                      <div className="text-center py-2">
                        <span className="text-green-600 font-semibold text-lg flex items-center justify-center">
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          You have full access to this class
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Course Fee:</span>
                        <span className="text-xl font-bold text-[#af1d33]">
                          ₹{classData.courseFee}
                        </span>
                      </div>
                    )
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Registration Fee:</span>
                        <span className="text-xl font-bold text-[#af1d33]">
                          ₹{classData.registrationFee}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Course Fee:</span>
                        <span className="text-xl font-bold text-[#af1d33]">
                          ₹{classData.courseFee}
                        </span>
                      </div>
                      <div className="h-px bg-gray-200 my-2"></div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium">
                          Total:
                        </span>
                        <span className="text-2xl font-bold text-[#af1d33]">
                          ₹
                          {(
                            (classData.registrationFee || 0) +
                            (classData.courseFee || 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center text-gray-700">
                  <Calendar className="mr-3 h-5 w-5 text-[#af1d33]" />
                  <div>
                    <div className="font-medium">Date</div>
                    <div>{classData.formattedDate}</div>
                  </div>
                </div>
                <div className="flex items-center text-gray-700">
                  <Clock className="mr-3 h-5 w-5 text-[#af1d33]" />
                  <div>
                    <div className="font-medium">Time</div>
                    <div>{classData.formattedTime}</div>
                  </div>
                </div>
                <div className="flex items-center text-gray-700">
                  <User className="mr-3 h-5 w-5 text-[#af1d33]" />
                  <div>
                    <div className="font-medium">Instructor</div>
                    <div>{classData.teacherName}</div>
                  </div>
                </div>
                {classData.capacity && (
                  <div className="flex items-center text-gray-700">
                    <Users className="mr-3 h-5 w-5 text-[#af1d33]" />
                    <div>
                      <div className="font-medium">Class Size</div>
                      <div>Maximum {classData.capacity} students</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {isAuthenticated ? (
                  <>
                    {hasAccessToLinks || classData.hasAccessToLinks ? (
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-6 rounded-full font-semibold"
                        onClick={() => handleJoinClass()}
                        disabled={isJoining}
                      >
                        {isJoining ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Join Class Now"
                        )}
                      </Button>
                    ) : isRegistered || classData.isRegistered ? (
                      <Button
                        className="w-full bg-[#af1d33] hover:bg-[#8f1829] text-white py-6 rounded-full font-semibold"
                        onClick={() => setShowCourseAccessDialog(true)}
                      >
                        <IndianRupee className="mr-2 h-5 w-5" />
                        Pay Course Fee & Access Links
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-[#af1d33] hover:bg-[#8f1829] text-white py-6 rounded-full font-semibold"
                        onClick={() => setShowRegistrationDialog(true)}
                      >
                        <IndianRupee className="mr-2 h-5 w-5" />
                        Register (₹{classData.registrationFee})
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    className="w-full bg-[#af1d33] hover:bg-[#8f1829] text-white py-6 rounded-full font-semibold"
                    onClick={() =>
                      router.push(
                        `/auth?redirect=${encodeURIComponent(window.location.pathname)}`
                      )
                    }
                  >
                    Sign In to Register
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 py-6 rounded-full font-medium"
                  onClick={handleShare}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share This Class
                </Button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start text-sm">
                <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-blue-800">
                  <p className="font-medium">Access Information</p>
                  <p className="mt-1">
                    {isAuthenticated ? (
                      hasAccessToLinks || classData.hasAccessToLinks ? (
                        <>
                          You have full access to this class. Click the "Join
                          Class Now" button or use the Zoom details below to
                          join at the scheduled time.
                        </>
                      ) : isRegistered || classData.isRegistered ? (
                        <>
                          You're registered for this class but you need to pay
                          the course fee (₹{classData.courseFee}) to access
                          meeting details. Click "Pay Course Fee" above.
                        </>
                      ) : (
                        <>
                          Complete your registration by paying the registration
                          fee (₹{classData.registrationFee}). After
                          registration, you'll need to pay the course fee (₹
                          {classData.courseFee}) to access the class.
                        </>
                      )
                    ) : (
                      "Sign in to register for this class. After registration and payment, you'll receive access to join at the scheduled time."
                    )}
                  </p>
                </div>
              </div>

              {/* Display Zoom meeting details when user has access */}
              {isAuthenticated &&
                (hasAccessToLinks || classData.hasAccessToLinks) &&
                classData.zoomLink && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                    <h3 className="font-medium text-green-800 mb-2 flex items-center">
                      <Video className="h-5 w-5 text-green-600 mr-2" />
                      Zoom Meeting Details
                    </h3>

                    <div className="space-y-3 text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-700">
                          Meeting Link:
                        </span>
                        <div className="flex items-center mt-1">
                          <a
                            href={classData.zoomLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-words flex-1 bg-white px-3 py-2 rounded-l-md border border-gray-200"
                          >
                            {classData.zoomLink.substring(0, 40)}...
                          </a>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-10 rounded-l-none"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                classData.zoomLink || ""
                              );
                              toast({
                                description: "Meeting link copied to clipboard",
                              });
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                        </div>
                      </div>

                      {classData.zoomMeetingId && (
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-700">
                            Meeting ID:
                          </span>
                          <div className="flex items-center mt-1">
                            <code className="bg-white px-3 py-2 rounded-l-md border border-gray-200 text-gray-800 flex-1">
                              {classData.zoomMeetingId}
                            </code>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-10 rounded-l-none"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  classData.zoomMeetingId || ""
                                );
                                toast({
                                  description: "Meeting ID copied to clipboard",
                                });
                              }}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </Button>
                          </div>
                        </div>
                      )}

                      {classData.zoomPassword && (
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-700">
                            Password:
                          </span>
                          <div className="flex items-center mt-1">
                            <code className="bg-white px-3 py-2 rounded-l-md border border-gray-200 text-gray-800 flex-1">
                              {classData.zoomPassword}
                            </code>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-10 rounded-l-none"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  classData.zoomPassword || ""
                                );
                                toast({
                                  description: "Password copied to clipboard",
                                });
                              }}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </Button>
                          </div>
                        </div>
                      )}

                      <Button
                        className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold flex items-center justify-center"
                        onClick={() =>
                          window.open(classData.zoomLink, "_blank")
                        }
                      >
                        <Video className="mr-2 h-5 w-5" />
                        Join Zoom Meeting Now
                      </Button>
                    </div>
                  </div>
                )}
            </div>
          </motion.div>
        </div>
      </div>

      {showPurchaseDialog && (
        <PurchaseDialog
          classData={classData}
          onClose={() => setShowPurchaseDialog(false)}
          onSuccess={handlePurchaseComplete}
        />
      )}

      {showRegistrationDialog && (
        <RegistrationDialog
          classData={classData}
          onClose={() => setShowRegistrationDialog(false)}
          onSuccess={handleRegistrationComplete}
        />
      )}

      {showCourseAccessDialog && (
        <CourseAccessDialog
          classData={classData}
          onClose={() => setShowCourseAccessDialog(false)}
          onSuccess={handleCourseAccessComplete}
        />
      )}
    </div>
  );
}
