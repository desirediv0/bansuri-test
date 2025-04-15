"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/helper/AuthContext";
import PurchaseDialog from "../components/PurchaseDialog";
import { HeroSection } from "@/app/(pages)/_components/HeroSectionProps";

export default function ClassDetails() {
  const params = useParams();

  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (id) {
      fetchClassDetails();
      // If user is authenticated, check subscription status separately
      if (isAuthenticated) {
        checkSubscriptionStatus();
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

  const fetchClassDetails = async () => {
    try {
      setLoading(true);
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

        if (classData.endTime) {
          const endDate = new Date(classData.endTime);
          const durationMs = endDate.getTime() - startDate.getTime();
          classData.duration = Math.round(durationMs / (1000 * 60));
        }
      }

      setClassData(classData);
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
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom/check-subscription/${id}`,
        { withCredentials: true }
      );

      if (response.data.data.isSubscribed && classData) {
        setClassData((prev: any) => ({
          ...prev,
          isSubscribed: true,
        }));

        if (response.data.data.reactivated) {
          toast({
            title: "Subscription Reactivated",
            description: "Your previous subscription has been reactivated.",
          });
        }
      }
    } catch (error) {
      console.error("Error checking subscription status:", error);
    }
  };

  const handleJoinClass = async () => {
    if (!isAuthenticated) {
      router.push(
        `/auth?redirect=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    try {
      setIsJoining(true);
      // Check if user is subscribed
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom/check-subscription/${id}`,
        { withCredentials: true }
      );

      if (response.data.data.isSubscribed) {
        if (classData.zoomLink) {
          window.open(classData.zoomLink, "_blank");
        } else {
          window.open(response.data.data.meetingDetails?.link, "_blank");
        }
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
    setShowPurchaseDialog(true);
  };

  const handlePurchaseComplete = () => {
    setShowPurchaseDialog(false);
    // Force reload class details including subscription status
    fetchClassDetails();
    // Explicitly check subscription status
    checkSubscriptionStatus();
    toast({
      title: "Success",
      description: "Class purchased successfully!",
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
                src={classData.thumbnailUrl}
                alt={classData.title}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

              {isAuthenticated && classData.isSubscribed && (
                <div className="absolute top-4 right-4">
                  <Badge
                    variant="secondary"
                    className="px-3 py-1.5 bg-[#af1d33] text-white font-medium"
                  >
                    Enrolled
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

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                What You'll Learn
              </h2>
              <ul className="space-y-3">
                {/* If the API provides learning points as an array, use them */}
                {classData.learningPoints &&
                Array.isArray(classData.learningPoints) &&
                classData.learningPoints.length > 0
                  ? classData.learningPoints.map(
                      (point: string, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3 mt-0.5">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <span className="text-gray-700">{point}</span>
                        </li>
                      )
                    )
                  : /* Default learning points if none are provided */
                    [
                      "Basic techniques of flute playing",
                      "Proper breath control and embouchure",
                      "Reading and interpreting music notation",
                      "Performing simple melodies and exercises",
                      "Understanding rhythm and timing",
                    ].map((point, idx) => (
                      <li key={idx} className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3 mt-0.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
              </ul>
            </div>
          </motion.div>

          {/* Right Column - Class Details & CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <div className="mb-6">
                <div className="text-3xl font-bold text-[#af1d33] mb-1">
                  ₹{classData.price}
                </div>
                {classData.originalPrice &&
                  classData.originalPrice > classData.price && (
                    <div className="flex items-center">
                      <span className="text-gray-500 line-through mr-2">
                        ₹{classData.originalPrice}
                      </span>
                      <Badge className="bg-green-600">
                        {Math.round(
                          (1 - classData.price / classData.originalPrice) * 100
                        )}
                        % OFF
                      </Badge>
                    </div>
                  )}
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
                {isAuthenticated && classData.isSubscribed ? (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-6 rounded-full font-semibold"
                    onClick={handleJoinClass}
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
                ) : (
                  <Button
                    className="w-full bg-[#af1d33] hover:bg-[#8f1829] text-white py-6 rounded-full font-semibold"
                    onClick={handlePurchase}
                  >
                    {isAuthenticated ? "Purchase Class" : "Sign In to Purchase"}
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
                    {isAuthenticated && classData.isSubscribed ? (
                      <>
                        Join using Zoom ID:{" "}
                        <span className="font-semibold">
                          {classData.zoomMeetingId}
                        </span>
                        {classData.zoomPassword && (
                          <>
                            {" "}
                            with password:{" "}
                            <span className="font-semibold">
                              {classData.zoomPassword}
                            </span>
                          </>
                        )}
                      </>
                    ) : (
                      "Once purchased, you'll receive instructions to join the class at the scheduled time. The class will be conducted live over Zoom."
                    )}
                  </p>
                </div>
              </div>
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
    </div>
  );
}
