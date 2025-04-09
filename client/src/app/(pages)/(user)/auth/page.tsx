"use client";

import Image from "next/image";
import AuthComponent from "./AuthComponent";
import { motion } from "framer-motion";

export default function AuthPage({
  searchParams,
}: {
  searchParams: { "course-slug": string };
}) {
  const courseSlug = searchParams["course-slug"];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      <div className="hidden md:block md:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-red-600/80 z-10" />
        <Image
          src="/rupak-sir.webp"
          alt="Indian Classical Music Background"
          fill
          className="object-cover object-center opacity-90"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          quality={100}
        />
        <div className="absolute inset-0 backdrop-blur-[2px] z-20 " />
        <motion.div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center p-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="text-center space-y-8"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.h1
              className="text-5xl md:text-7xl font-bold text-white"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Welcome to Bansuri Vidya Mandir
            </motion.h1>
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-xl md:text-2xl text-white/90 font-light">
                Your Gateway to Indian Classical Music
              </p>
              <div className="flex items-center justify-center space-x-3">
                <span className="h-[2px] w-12 bg-red-500" />
                <span className="text-white/80 text-sm font-medium">
                  Established Music Institute
                </span>
                <span className="h-[2px] w-12 bg-red-500" />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>



      {/* Right Section */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 bg-gradient-to-tr from-red-50 to-red-100">
        <motion.div
          className="w-full max-w-lg"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-4 md:p-8">
            <AuthComponent courseSlug={courseSlug} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}