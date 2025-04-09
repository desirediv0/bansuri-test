"use client";

import { Course2 } from "@/type";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

interface CourseProps {
  course: Course2;
}

export function CourseCard({ course }: CourseProps) {
  return (
    <Link href={`/courses/${course.slug || course.id}`}>
      <motion.div
        layoutId={course.id}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl 
        transition-all duration-300 hover:scale-105"
      >
        {/* Course Image */}
        <div className="relative aspect-video">
          <Image
            src={course.image}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        </div>

        {/* Course Content */}
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold leading-tight line-clamp-2">
            {course.title}
          </h3>

          <p className="text-gray-600 line-clamp-3">{course.description}</p>

        </div>
      </motion.div>
    </Link>
  );
}