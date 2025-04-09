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
import { Loader2, Calendar, Clock, User, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import Image from "next/image";

export default function PurchaseDialog({ classData, onClose, onSuccess }: { classData: any, onClose: () => void, onSuccess: () => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const initiatePayment = async () => {
        try {
            setIsLoading(true);

            // Create subscription order
            const orderResponse = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/zoom/subscribe`,
                { zoomSessionId: classData.id },
                { withCredentials: true }
            );

            const { order, zoomSession } = orderResponse.data.data;

            // Initialize Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "Bansuri Vidya Mandir | Indian Classical Music Institute",
                description: `Purchase: ${zoomSession.title}`,
                order_id: order.id,
                image: "/logo-black.png",
                handler: async function (response: any) {
                    try {
                        // Verify payment
                        const verifyResponse = await axios.post(
                            `${process.env.NEXT_PUBLIC_API_URL}/zoom/verify-payment`,
                            {
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                zoomSessionId: classData.id
                            },
                            { withCredentials: true }
                        );

                        onSuccess();
                    } catch (error) {
                        console.error("Payment verification failed:", error);
                        toast({
                            title: "Payment Failed",
                            description: "We couldn't verify your payment. Please try again or contact support.",
                            variant: "destructive",
                        });
                    }
                },
                prefill: {
                    name: "",
                    email: "",
                    contact: ""
                },
                theme: {
                    color: "#EF4444",
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();

        } catch (error) {
            console.error("Payment initiation failed:", error);
            toast({
                title: "Error",
                description: "Unable to initiate payment. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Load Razorpay script
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
    };

    const defaultThumbnail = "/images/default-class-thumbnail.jpg";

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white rounded-xl border-none shadow-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <DialogTitle className="text-2xl font-bold text-gray-800">Purchase Live Class</DialogTitle>
                        <DialogDescription className="text-gray-600 mt-1">
                            Secure your spot in this exclusive live class session
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
                                staggerChildren: 0.1
                            }
                        }
                    }}
                >
                    <motion.div variants={item} className="relative h-40 w-full overflow-hidden rounded-lg">
                        <Image
                            src={classData.thumbnailUrl || defaultThumbnail}
                            alt={classData.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-60"></div>
                    </motion.div>

                    <motion.div
                        className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200"
                        variants={item}
                    >
                        <h3 className="font-bold text-xl text-gray-800">{classData.title}</h3>
                        <p className="text-gray-600 mt-1">{classData.description}</p>
                    </motion.div>

                    <motion.div className="space-y-3" variants={item}>
                        <div className="flex items-center text-gray-700">
                            <Calendar className="mr-3 h-5 w-5 text-[#af1d33]" />
                            <span>{classData.formattedDate}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                            <Clock className="mr-3 h-5 w-5 text-[#af1d33]" />
                            <span>{classData.formattedTime} • {classData.duration} minutes</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                            <User className="mr-3 h-5 w-5 text-[#af1d33]" />
                            <span>Instructor: {classData.teacherName}</span>
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-[#af1d33]/10 p-4 rounded-lg flex justify-between items-center"
                        variants={item}
                    >
                        <span className="text-gray-700 font-medium">Price</span>
                        <span className="text-2xl font-bold text-[#af1d33]">₹{classData.price}</span>
                    </motion.div>

                    <motion.div className="space-y-2" variants={item}>
                        <h4 className="font-semibold text-gray-800">What's included:</h4>
                        <ul className="space-y-2">
                            <li className="flex items-center text-gray-700">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Live interactive session with the instructor</span>
                            </li>
                            <li className="flex items-center text-gray-700">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Q&A opportunity during the class</span>
                            </li>
                            <li className="flex items-center text-gray-700">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Access to session recording (if available)</span>
                            </li>
                        </ul>
                    </motion.div>
                </motion.div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} className="rounded-full border-gray-300">Cancel</Button>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                            onClick={initiatePayment}
                            disabled={isLoading}
                            className="bg-[#af1d33] hover:bg-[#8f1829] text-white rounded-full px-6 shadow-md"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                "Secure Your Spot"
                            )}
                        </Button>
                    </motion.div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
