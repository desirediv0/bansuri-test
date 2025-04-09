"use client";

import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { courses } from "./courses";
import { CourseCard } from "./CourseCard";


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};



export default function CourseListing() {


  return (
    <div className="relative">
      <div
        className="absolute top-0 left-0 w-full h-full smooth-move pointer-events-none
          before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-r 
          before:from-[#F3F8F8]/80 before:to-transparent before:z-[1]"
        style={{
          backgroundImage: "url('/c-list-b.png')",
          backgroundSize: "clamp(300px, 70%, 800px) 100%",
          backgroundPosition: "left center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="max-w-7xl mx-auto px-4 py-12 overflow-x-hidden relative z-10 overflow-y-hidden">
        <LayoutGroup>
          <div className="flex flex-col items-center space-y-8">
            <div className="flex flex-col lg:flex-row items-center justify-between w-full gap-6">
              <motion.h2
                layout
                className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 text-center lg:text-left"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Popular courses
              </motion.h2>
            </div>

            {/* Course Grid */}
            <motion.div
              layout
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
            >
              <AnimatePresence mode="popLayout">
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Bottom CTA */}
            <motion.p
              layout
              className="text-center text-gray-600 mt-8 md:text-lg"
            >
              We help you find the perfect tutor. It's completely free.{" "}
              <motion.a
                href="#"
                className="text-primary hover:underline font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Explore all courses →
              </motion.a>
            </motion.p>
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
}
