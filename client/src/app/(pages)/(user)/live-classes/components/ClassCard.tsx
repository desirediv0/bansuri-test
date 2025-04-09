"use client";

import { useState } from "react";
import Image from "next/image";
import axios from "axios";
import { Calendar, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PurchaseDialog from "./PurchaseDialog";

export default function ClassCard({ classData, onPurchase }: { classData: any; onPurchase: () => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleJoinClass = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/zoom/check-subscription/${classData.id}`,
                { withCredentials: true }
            );

            if (response.data.data.isSubscribed) {
                window.open(response.data.data.meetingDetails.link, "_blank");
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
            setIsLoading(false);
        }
    };

    const handlePurchaseIntent = () => {
        setShowPurchaseDialog(true);
    };

    const handlePurchaseComplete = () => {
        setShowPurchaseDialog(false);
        onPurchase();
        toast({
            title: "Success",
            description: "Class purchased successfully!",
        });
    };

    const defaultThumbnail = "/images/default-class-thumbnail.jpg";

    return (
        <Card className="w-full overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 rounded-xl">
            <div className="relative h-56 w-full overflow-hidden">
                <Image
                    src={classData.thumbnailUrl || defaultThumbnail}
                    alt={classData.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    style={{ objectPosition: 'center 30%' }}
                />
                {classData.isSubscribed && (
                    <div className="absolute top-4 right-4 z-10">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                            <Badge variant="secondary" className="px-3 py-1.5 bg-[#af1d33] text-white font-medium shadow-md">
                                Enrolled
                            </Badge>
                        </motion.div>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                <div className="absolute bottom-3 left-3">
                    {!classData.isSubscribed && (
                        <Badge variant="outline" className="bg-white/90 text-[#af1d33] border-[#af1d33] text-base px-3 py-1 font-semibold shadow-md">
                            ₹{classData.price}
                        </Badge>
                    )}
                </div>
            </div>
            <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-xl font-bold text-gray-800 line-clamp-2">{classData.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-3">
                <p className="text-sm text-gray-600 line-clamp-2">
                    {classData.description || "No description available for this class."}
                </p>
                <div className="space-y-2.5 pt-3 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-700">
                        <User className="mr-2 h-4 w-4 text-[#af1d33]" />
                        <span className="font-medium">{classData.teacherName}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                        <Calendar className="mr-2 h-4 w-4 text-[#af1d33]" />
                        <span>{classData.formattedDate}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                        <Clock className="mr-2 h-4 w-4 text-[#af1d33]" />
                        <span>{classData.formattedTime} </span>
                    </div>
                    {classData.capacity && (
                        <div className="text-sm text-gray-700 flex items-center">
                            <span className="font-semibold mr-1">Capacity:</span> {classData.capacity} students
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="pt-0">
                {classData.isSubscribed ? (
                    <motion.div className="w-full" whileTap={{ scale: 0.98 }}>
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full py-5 shadow-md"
                            onClick={handleJoinClass}
                            disabled={isLoading}
                        >
                            {isLoading ? "Loading..." : "Join Class"}
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div className="w-full" whileTap={{ scale: 0.98 }}>
                        <Button
                            className="w-full bg-[#af1d33] hover:bg-[#8f1829] text-white font-semibold rounded-full py-5 shadow-md"
                            onClick={handlePurchaseIntent}
                            variant="default"
                        >
                            Purchase Class
                        </Button>
                    </motion.div>
                )}
            </CardFooter>

            {showPurchaseDialog && (
                <PurchaseDialog
                    classData={classData}
                    onClose={() => setShowPurchaseDialog(false)}
                    onSuccess={handlePurchaseComplete}
                />
            )}
        </Card>
    );
}
