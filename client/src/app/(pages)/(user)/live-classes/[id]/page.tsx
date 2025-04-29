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
  Info,
  Share2,
  Loader2,
  CheckCircle2,
  Video,
  Copy,
  CreditCard,
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
      console.log("Fetching class details for ID:", id);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/class/${id}`
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
    } catch (error: any) {
      console.error("Error fetching class details:", error);
      const errorMessage =
        error.response?.status === 404
          ? "The class you're looking for doesn't exist or has been removed."
          : "Failed to load class details. Please try again.";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      if (error.response?.status === 404) {
        setTimeout(() => router.push("/live-classes"), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/check-subscription/${id}`,
        { withCredentials: true }
      );

      if (response.data.data) {
        const {
          isSubscribed,
          isRegistered,
          hasAccessToLinks,
          meetingDetails,
          courseFeeEnabled,
        } = response.data.data;

        setIsRegistered(!!isRegistered);
        setHasAccessToLinks(!!hasAccessToLinks);

        setClassData((prev: any) => {
          if (!prev) return prev;

          return {
            ...prev,
            isSubscribed: !!isSubscribed,
            isRegistered: !!isRegistered,
            hasAccessToLinks: !!hasAccessToLinks,
            courseFeeEnabled: courseFeeEnabled,
            ...(hasAccessToLinks && meetingDetails
              ? {
                  zoomLink: meetingDetails.link || prev.zoomLink,
                  zoomMeetingId: meetingDetails.meetingId || prev.zoomMeetingId,
                  zoomPassword: meetingDetails.password || prev.zoomPassword,
                }
              : {}),
          };
        });

        // Show appropriate toast messages based on status
        if (isRegistered && !hasAccessToLinks && courseFeeEnabled) {
          toast({
            title: "Course Fee Required",
            description: "Please pay the course fee to access class links.",
          });
        } else if (isRegistered && !courseFeeEnabled) {
          toast({
            title: "Registration Complete",
            description: "You can now access the class links.",
          });
        }
      }

      setApiChecksCompleted((prev) => ({ ...prev, checkSubscription: true }));
    } catch (error: any) {
      console.error("Error checking subscription status:", error);
      if (error.response?.status !== 404) {
        toast({
          title: "Note",
          description:
            "Could not check subscription status. This won't affect your ability to view the class.",
        });
      }
      setApiChecksCompleted((prev) => ({ ...prev, checkSubscription: true }));
    }
  };

  const checkPaymentStatus = async () => {
    try {
      console.log("Checking payment status for ID:", id);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/check-subscription/${id}`,
        { withCredentials: true }
      );

      if (response.data.data) {
        const { isRegistered, hasAccessToLinks } = response.data.data;

        console.log("Payment status results:", {
          isRegistered,
          hasAccessToLinks,
        });

        setIsRegistered(!!isRegistered);
        setHasAccessToLinks(!!hasAccessToLinks);

        setClassData((prev: any) => {
          if (!prev) return prev;

          return {
            ...prev,
            isRegistered: !!isRegistered,
            hasAccessToLinks: !!hasAccessToLinks,
          };
        });

        // Removed the redirect to user-profile to avoid interrupting the flow
        if (hasAccessToLinks) {
          toast({
            title: "Access Available",
            description: "You already have full access to this class.",
          });
        }
      }

      setApiChecksCompleted((prev) => ({ ...prev, checkPaymentStatus: true }));
    } catch (error: any) {
      console.error("Error checking payment status:", error);

      // Don't show a toast here to avoid duplicate error messages
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
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/check-subscription/${classData.id}${queryParams}`,
        { withCredentials: true }
      );

      if (
        response.data.data.hasAccessToLinks &&
        response.data.data.meetingDetails?.link
      ) {
        window.open(response.data.data.meetingDetails.link, "_blank");
      } else {
        toast({
          title: "Access Denied",
          description: "You need to complete registration to join this class.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
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
        <Button
          variant="ghost"
          onClick={() => router.push("/live-classes")}
          className="mb-6 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to all classes
        </Button>

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

            {classData.currentRaga && classData.currentRaga.trim() !== "" && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                  Current Raga
                </h2>
                <p className="text-gray-700">{classData.currentRaga}</p>
              </div>
            )}

            {classData.currentOrientation &&
              classData.currentOrientation.trim() !== "" && (
                <div className="bg-white rounded-xl shadow-md p-6 mt-8">
                  <h2 className="text-xl font-bold mb-4 text-gray-800">
                    Current Orientation
                  </h2>
                  <p className="text-gray-700 whitespace-pre-line">
                    {classData.currentOrientation}
                  </p>
                </div>
              )}

            {classData.sessionDescription &&
              classData.sessionDescription.trim() !== "" && (
                <div className="bg-white rounded-xl shadow-md p-6 mt-8">
                  <h2 className="text-xl font-bold mb-4 text-gray-800">
                    Session Description
                  </h2>
                  <p className="text-gray-700 whitespace-pre-line">
                    {classData.sessionDescription}
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
                {userIsRegistered && !userHasAccess && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="text-sm font-medium text-gray-500">
                      Registration Status:
                    </div>
                    <div
                      className={`mt-1 px-3 py-1.5 rounded-md text-sm font-medium inline-flex items-center ${
                        !classData.isApproved
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {!classData.isApproved
                        ? "Pending Admin Approval"
                        : "Approved - Ready for Payment"}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {userIsRegistered && !userHasAccess ? (
                  <div>
                    {classData?.courseFeeEnabled ? (
                      <Button
                        onClick={() => setShowCourseAccessDialog(true)}
                        className="w-full bg-gradient-to-r from-[#af1d33] to-[#8f1729] hover:from-[#8f1729] hover:to-[#af1d33] text-white py-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <CreditCard className="mr-2 h-5 w-5" />
                        Pay Course Fee
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleJoinClass()}
                        disabled={isJoining}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-600 text-white py-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {isJoining ? (
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : (
                          <Video className="h-5 w-5 mr-2" />
                        )}
                        {isJoining ? "Joining..." : "Join Live Class"}
                      </Button>
                    )}
                    <p className="text-sm text-gray-600 mt-3 text-center">
                      {classData?.courseFeeEnabled
                        ? "Complete your payment to get access to the live class"
                        : "You're all set! Click to join the live class"}
                    </p>
                  </div>
                ) : userHasAccess ? (
                  <Button
                    onClick={() => handleJoinClass()}
                    disabled={isJoining}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-600 text-white py-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    {isJoining ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <Video className="h-5 w-5 mr-2" />
                    )}
                    {isJoining ? "Joining..." : "Join Live Class"}
                  </Button>
                ) : (
                  <Button
                    onClick={handlePurchase}
                    className="w-full bg-gradient-to-r from-[#af1d33] to-[#8f1729] hover:from-[#8f1729] hover:to-[#af1d33] text-white py-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    Register for Class
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 py-6 rounded-full font-medium"
                  onClick={handleShare}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share This Class
                </Button>
              </div>

              <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Access Information
                    </h4>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      {isAuthenticated ? (
                        hasAccessToLinks || classData?.hasAccessToLinks ? (
                          <>
                            You have full access to this live class. Click the
                            "Join Live Class" button to participate at the
                            scheduled time.
                          </>
                        ) : isRegistered || classData?.isRegistered ? (
                          classData?.courseFeeEnabled ? (
                            <>
                              You're registered! Complete the course fee payment
                              (₹{classData.courseFee}) to join the live class.
                            </>
                          ) : (
                            <>
                              Registration complete! You can now join the live
                              class at the scheduled time.
                            </>
                          )
                        ) : (
                          <>
                            Register now with a one-time fee of ₹
                            {classData.registrationFee}.
                            {classData?.courseFeeEnabled
                              ? " After registration, you'll need to pay the course fee to join the live class."
                              : " After registration, you'll get immediate access to join the live class."}
                          </>
                        )
                      ) : (
                        "Sign in to register for this live class and start your learning journey."
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Display Zoom meeting details when user has access */}
              {isAuthenticated &&
                (hasAccessToLinks || classData.hasAccessToLinks) &&
                classData.zoomLink && (
                  <div className="mt-4 p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-green-800 text-lg flex items-center">
                          <Video className="h-5 w-5 text-green-600 mr-2" />
                          Live Class Access
                        </h3>
                        <p className="text-green-700 mt-1 text-sm">
                          Click the button below to join the live class at the
                          scheduled time
                        </p>
                      </div>
                      <Button
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-600 text-white py-6 px-8 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        onClick={() => handleJoinClass()}
                        disabled={isJoining}
                      >
                        {isJoining ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Video className="h-5 w-5" />
                        )}
                        {isJoining ? "Joining..." : "Join Live Class"}
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
