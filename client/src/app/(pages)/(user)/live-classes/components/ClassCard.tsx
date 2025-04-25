"use client";

import React from "react";
import Image from "next/image";
import { Calendar, Clock, User, ArrowRight, IndianRupee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface ClassCardProps {
  classData: any;
  isAuthenticated: boolean;
}

export default function ClassCard({
  classData,
  isAuthenticated,
}: ClassCardProps) {
  const router = useRouter();

  if (!classData || !classData.id) {
    return null;
  }

  const handleCardClick = () => {
    // Guard against missing data
    if (!classData) {
      console.error("ClassCard: Missing classData");
      return;
    }

    try {
      // Always navigate to detail page using slug if available (preferred) or ID as fallback
      const identifier = classData.slug || classData.id;

      if (!identifier) {
        console.error(
          "ClassCard: Missing both slug and id in classData",
          classData
        );
        return;
      }

      router.push(`/live-classes/${identifier}`);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  // Define a default thumbnail image
  const defaultThumbnail = "/images/default-class-thumbnail.jpg";

  return (
    <motion.div
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="cursor-pointer"
      onClick={handleCardClick}
    >
      <Card className="w-full overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 rounded-xl group h-full">
        <div className="relative h-56 w-full overflow-hidden">
          <Image
            src={classData.thumbnailUrl || defaultThumbnail}
            alt={classData.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            style={{ objectPosition: "center 30%" }}
          />
          {/* Status badges */}
          {isAuthenticated && (
            <>
              {classData.hasAccessToLinks ? (
                <div className="absolute top-4 right-4 z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Badge
                      variant="secondary"
                      className="px-3 py-1.5 bg-green-600 text-white font-medium shadow-md"
                    >
                      Access Granted
                    </Badge>
                  </motion.div>
                </div>
              ) : classData.isRegistered ? (
                <div className="absolute top-4 right-4 z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Badge
                      variant="secondary"
                      className="px-3 py-1.5 bg-[#af1d33] text-white font-medium shadow-md"
                    >
                      Registered
                    </Badge>
                  </motion.div>
                </div>
              ) : null}
            </>
          )}
          <div className="absolute bottom-3 left-3">
            <Badge
              variant="outline"
              className="bg-white/90 text-[#af1d33] border-[#af1d33] text-base px-3 py-1 font-semibold shadow-md"
            >
              ₹{classData.registrationFee}
            </Badge>
          </div>
          <div className="absolute bottom-3 right-3">
            <Badge
              variant="outline"
              className="bg-white/90 text-blue-600 border-blue-600 text-xs px-2 py-1 font-medium shadow-md group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300"
            >
              <span className="flex items-center">
                View Details
                <ArrowRight className="ml-1 h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Badge>
          </div>
        </div>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-xl font-bold text-gray-800 line-clamp-2 group-hover:text-[#af1d33] transition-colors duration-300">
            {classData.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-6">
          <p className="text-sm text-gray-600 line-clamp-2">
            {classData.description ||
              classData.sessionDescription ||
              "No description available for this class."}
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
            <div className="flex items-center text-sm text-gray-700">
              <IndianRupee className="mr-2 h-4 w-4 text-[#af1d33]" />
              <span>
                Registration: ₹{classData.registrationFee} | Course: ₹
                {classData.courseFee}
              </span>
            </div>
            {classData.currentRaga && (
              <div className="text-sm text-gray-700">
                <span className="font-semibold">Raga:</span>{" "}
                {classData.currentRaga}
              </div>
            )}
            {classData.currentOrientation && (
              <div className="text-sm text-gray-700">
                <span className="font-semibold">Orientation:</span>{" "}
                {classData.currentOrientation}
              </div>
            )}
          </div>
        </CardContent>

        {/* Payment and access status indicator */}
        {isAuthenticated &&
          (classData.isRegistered || classData.hasAccessToLinks) && (
            <div className="border-t border-gray-100 px-6 py-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status:</span>
                <div className="flex space-x-2">
                  <Badge
                    variant={classData.isRegistered ? "outline" : "secondary"}
                    className={`text-xs ${
                      classData.isRegistered
                        ? "border-green-600 text-green-700 bg-green-50"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {classData.isRegistered ? "Registered" : "Not Registered"}
                  </Badge>
                  <Badge
                    variant={
                      classData.hasAccessToLinks ? "outline" : "secondary"
                    }
                    className={`text-xs ${
                      classData.hasAccessToLinks
                        ? "border-green-600 text-green-700 bg-green-50"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {classData.hasAccessToLinks
                      ? "Access Granted"
                      : "No Access"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
      </Card>
    </motion.div>
  );
}
