"use client";

import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { SquareCard } from "./squareCard";
import { courses } from "./courses";
import { AnimatedText } from "../AnimatedText";
import { Award } from "lucide-react";
import Image from "next/image";



const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};



export default function LearningStyle() {

    return (
        <div className="relative overflow-hidden">
            <Image
                src="/l-1.png"
                alt="Decorative Image 1"
                width={100}
                height={100}
                className="absolute top-0 -right-14 h-auto w-96 rotate-y-180"
            />
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
            {/* <Image
                          src="/l-2.png"
                          alt="Decorative Image 2"
                          width={150}
                          height={150}
                          className="absolute top-1/2 -right-56 -translate-y-1/2 h-auto w-80 rotate-[-55deg] opacity-5"
                        /> */}

            <div className="max-w-7xl mx-auto px-4 py-12 overflow-x-hidden relative z-10 overflow-y-hidden">
                <LayoutGroup>
                    <div className="flex flex-col items-center space-y-8">

                        <div className="flex flex-col w-full gap-6">
                            {/* <div className="flex flex-col lg:flex-row items-center justify-between w-full gap-6"> */}

                            <div className="flex w-fit items-center gap-2 px-4 py-2">
                                <div className="flex p-4 items-center justify-center rounded-full bg-[#ba1c33]">
                                    <Award size={24} color="#fff" />
                                </div>
                                <AnimatedText
                                    text="Learning Style"
                                    className="text-lg font-medium text-[#107D6C]"
                                    delay={0.5}
                                />
                            </div>

                            <motion.h2
                                layout
                                className="text-3xl md:text-4xl lg:text-6xl font-bold text-gray-900 text-center lg:text-left pb-8"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                Choose your Learning Style
                            </motion.h2>
                        </div>

                        {/* Course Grid */}
                        <motion.div
                            layout
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
                        >
                            <AnimatePresence mode="popLayout">
                                {courses.map((course) => (
                                    <SquareCard
                                        key={course.id}
                                        course={course}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </LayoutGroup>
            </div>
        </div>
    );
}