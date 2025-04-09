"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ChevronLeft, ChevronRight, Star, Play } from 'lucide-react';
import { testimonials } from "./data";
import Image from "next/image";
import { AnimatedText } from "../AnimatedText";
import { VideoModal } from "./VideoModal";

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  useEffect(() => {
    if (autoPlay) {
      const interval = setInterval(next, 5000);
      return () => clearInterval(interval);
    }
  }, [autoPlay]);

  return (
    <div className="bg-[#4b131c] px-4 py-20 md:pt-40 md:pb-10 overflow-hidden border-b-4 border-[#e9ec3b] relative">
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => {
          setIsVideoModalOpen(false);
          setAutoPlay(true);
        }}
        videoUrl={testimonials[currentIndex].videoUrl}
        title={testimonials[currentIndex].name}
        content={testimonials[currentIndex].content}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(246,189,184,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-start mb-32">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="bg-[#fff] p-3 rounded-full">
                <MessageCircle className="w-6 h-6 text-[#4b131c]" />
              </div>
              <span className="text-white text-lg">Students feedback</span>
            </div>

            <div className="space-y-6">
              <AnimatedText
                text="Voices of Our Students"
                className="text-4xl sm:text-5xl md:text-6xl font-bold text-white"
              />

              <p className="text-gray-300 text-base sm:text-lg">
              We take pride in the impact we have on our students' lives. View heartfelt experiences shared by students, who have been part of our journey.
              </p>
              {/* <div className="flex items-center gap-6">
                <div className="text-white">
                  <span className="text-4xl sm:text-5xl md:text-6xl font-bold">99%</span>
                </div>
                <p className="text-gray-400 text-sm sm:text-base">
                  Student's complete
                  <br />
                  course successfully.
                </p>
              </div> */}
            </div>
          </div>

          {/* Right Testimonial Carousel */}
          <div className="relative mr-3">
            <div className="hidden md:block z-10">
              <button
                onClick={prev}
                className="absolute -left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white text-gray-800 hover:bg-gray-100 transition-all shadow-md z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={next}
                className="absolute -right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white text-gray-800 hover:bg-gray-100 transition-all shadow-md"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Testimonial Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="bg-white rounded overflow-hidden shadow-xl z-1"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image Section */}
                  <div className="relative h-[250px] md:h-[300px] md:w-1/2">
                    <motion.div
                      layoutId="play-button"
                      className="absolute inset-0 flex items-center justify-center z-10"
                      onClick={() => {
                        setIsVideoModalOpen(true);
                        setAutoPlay(false);
                      }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        className="bg-white/90 p-4 rounded-full hover:bg-white transition-colors"
                      >
                        <Play className="w-6 h-6 text-[#4b131c]" />
                      </motion.button>
                    </motion.div>
                    <Image
                      src={testimonials[currentIndex].image || "/placeholder.svg"}
                      alt={testimonials[currentIndex].name}
                      width={400}
                      height={600}
                      className="w-full h-full object-cover hover:opacity-75 transition-opacity"
                    />
                  </div>

                  {/* Content Section */}
                  <div className="p-8 md:w-1/2">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm sm:text-base mb-6">
                      {testimonials[currentIndex].content}
                    </p>
                    <div>
                      <h3 className="font-semibold text-lg sm:text-xl text-gray-900">
                        {testimonials[currentIndex].name}
                      </h3>
                      {/* <p className="text-gray-500 text-sm sm:text-base">
                        {testimonials[currentIndex].role}
                      </p> */}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons - Mobile */}
            <div className="flex md:hidden items-center justify-center gap-4 mt-8">
              <button
                onClick={prev}
                className="p-3 rounded-full bg-white text-gray-800 hover:bg-gray-100 transition-all shadow-md"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${i === currentIndex ? "bg-white" : "bg-gray-600"
                      }`}
                  />
                ))}
              </div>
              <button
                onClick={next}
                className="p-3 rounded-full bg-white text-gray-800 hover:bg-gray-100 transition-all shadow-md"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Company Logos */}
        {/* <motion.div
          className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {companyLogos.map((logo) => (
            <motion.div
              key={logo.name}
              whileHover={{ scale: 1.05 }}
              className="flex justify-center group"
            >
              <div className="relative w-32 h-20">
                <Image
                  src={logo.image}
                  alt={logo.name}
                  fill
                  className="object-contain brightness-0 invert opacity-70 group-hover:opacity-100 transition-all duration-300"
                  sizes="(max-width: 768px) 100px, 150px"
                />
              </div>
            </motion.div>
          ))}
        </motion.div> */}
      </div>
    </div>
  );
}

