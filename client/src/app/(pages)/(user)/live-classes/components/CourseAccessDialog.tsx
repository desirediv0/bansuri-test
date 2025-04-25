"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Calendar,
  Clock,
  Video,
  Lock,
  Check,
  IndianRupee,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Image from "next/image";

// Add TypeScript declarations after imports
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CourseAccessDialogProps {
  classData: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CourseAccessDialog({
  classData,
  onClose,
  onSuccess,
}: CourseAccessDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      console.log("Razorpay script loaded successfully");
    };
    script.onerror = () => {
      console.error("Failed to load Razorpay script");
      toast.error("Payment system failed to load. Please refresh the page.");
    };
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, []);

  const initiateCourseAccess = async () => {
    try {
      setIsLoading(true);

      // Ensure Razorpay is loaded
      if (typeof window.Razorpay === "undefined") {
        toast.error(
          "Payment gateway not loaded. Please refresh the page and try again."
        );
        return;
      }

      // Create course access payment
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/pay-course-access`,
        {
          zoomLiveClassId: classData.id,
        },
        { withCredentials: true }
      );

      console.log("Course access payment initiated:", response.data);

      // If user already has access
      if (response.data.data.alreadyHasAccess) {
        toast.info("You already have access to this class");
        onSuccess();
        return;
      }

      const order = response.data.data.order;

      // Get Razorpay Key from server
      const keyResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/payment/getpublickey`
      );
      const key = keyResponse.data.key;

      // Initialize Razorpay
      const options = {
        key: key,
        amount: order.amount,
        currency: order.currency,
        name: "Bansuri Vidya Mandir | Indian Classical Music Institute",
        description: `Course Access for: ${classData.title}`,
        order_id: order.id,
        image: "/logo-black.png",
        handler: async function (response: any) {
          try {
            setIsProcessing(true);

            // Verify payment
            const verifyResponse = await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/verify-course-access`,
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                zoomLiveClassId: classData.id,
              },
              { withCredentials: true }
            );

            toast.success(
              "Payment successful! You now have access to the class links."
            );
            onSuccess();
          } catch (error) {
            console.error("Payment verification failed:", error);
            toast.error(
              "We couldn't verify your payment. Please try again or contact support."
            );
          } finally {
            setIsProcessing(false);
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
      console.error("Course access payment initiation failed:", error);
      toast.error(
        error.response?.data?.message ||
          "Unable to initiate payment. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const defaultThumbnail = "/images/default-class-thumbnail.jpg";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-xl border-none shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DialogTitle className="text-2xl font-bold text-gray-800">
              Access Class Links
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-1">
              Complete your payment to unlock access to the class
            </DialogDescription>
          </motion.div>
        </DialogHeader>

        <motion.div
          className="py-3 space-y-4"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          <motion.div
            variants={item}
            className="relative h-40 w-full overflow-hidden rounded-lg"
          >
            <Image
              src={classData.thumbnailUrl || defaultThumbnail}
              alt={classData.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-60"></div>
            <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <Check size={12} />
              Registered
            </div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200"
            variants={item}
          >
            <h3 className="font-bold text-xl text-gray-800">
              {classData.title}
            </h3>
            <p className="text-gray-600 mt-1">{classData.description}</p>
          </motion.div>

          <motion.div className="space-y-3" variants={item}>
            <div className="flex items-center text-gray-700">
              <Calendar className="mr-3 h-5 w-5 text-[#af1d33]" />
              <span>{classData.formattedDate}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Clock className="mr-3 h-5 w-5 text-[#af1d33]" />
              <span>{classData.formattedTime}</span>
            </div>
          </motion.div>

          <motion.div
            className="bg-[#af1d33]/10 p-4 rounded-lg flex justify-between items-center"
            variants={item}
          >
            <span className="text-gray-700 font-medium">Course Fee</span>
            <span className="text-2xl font-bold text-[#af1d33]">
              ₹{classData.courseFee}
            </span>
          </motion.div>

          <motion.div
            className="space-y-3 p-4 bg-blue-50 rounded-lg"
            variants={item}
          >
            <h4 className="font-semibold text-blue-800">What you'll get:</h4>
            <div className="flex items-start gap-2">
              <Video className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-blue-800 font-medium">
                  Access to Live Class
                </p>
                <p className="text-blue-600 text-sm">
                  Join the class via Zoom with instructor interaction
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-blue-800 font-medium">Secure Zoom Details</p>
                <p className="text-blue-600 text-sm">
                  Receive meeting ID, password, and direct join link
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="text-sm p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800"
            variants={item}
          >
            After payment, you'll immediately receive access to the class links.
          </motion.div>
        </motion.div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-full border-gray-300"
          >
            Cancel
          </Button>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={initiateCourseAccess}
              disabled={isLoading || isProcessing}
              className="bg-[#af1d33] hover:bg-[#8f1829] text-white rounded-full px-6 shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Pay Course Fee"
              )}
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
