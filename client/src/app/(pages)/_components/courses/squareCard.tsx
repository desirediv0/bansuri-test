"use client";

import { Course2 } from "@/type";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface CourseCardProps {
    course: Course2
}

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



export function SquareCard({ course }: CourseCardProps) {
    return (
        <Link href={`/${course.slug}`}>
            <motion.div
                layoutId={course.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl 
      transition-all duration-300 transform hover:scale-105 pb-6"
            >
                {/* Course Image */}
                <div className="relative">
                    <Image
                        src={course.image}
                        alt={course.title}
                        width={1000}
                        height={500}
                        className="object-fill hover:scale-105 transition-transform duration-300"
                    />
                </div>

                {/* Course Content */}
                <div className="p-6 space-y-4">
                    <h3 className="text-lg md:text-xl lg:text-2xl font-semibold leading-tight line-clamp-2">
                        {course.title}
                    </h3>
                    <p className="text-md leading-tight">
                        {course.description}
                    </p>
                </div>
            </motion.div>
        </Link>
    );
}