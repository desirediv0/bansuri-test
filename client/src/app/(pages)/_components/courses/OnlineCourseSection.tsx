"use client";

import { motion, LayoutGroup } from "framer-motion";
import { AnimatedText } from "../AnimatedText";
import { ArrowRight, Award } from "lucide-react";
import Image from "next/image";
import CustomButton from "../CustomButton";
import CoursesSection from "../../(user)/online-courses/CoursesSection";


export default function OnlineCourseSection() {

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

            <div className="max-w-7xl mx-auto px-4 py-12 overflow-x-hidden relative z-10 overflow-y-hidden">
                <LayoutGroup>
                    <div className="flex flex-col items-center space-y-2">

                        <div className="flex flex-col w-full gap-6">

                            <div className="flex w-fit items-center gap-2 px-4 py-2">
                                <div className="flex p-4 items-center justify-center rounded-full bg-[#ba1c33]">
                                    <Award size={24} color="#fff" />
                                </div>
                                <AnimatedText
                                    text="Online Courses"
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
                                Choose Your Course
                            </motion.h2>
                        </div>

                        {/* Course Grid */}
                        <CoursesSection />
                        <CustomButton
                            primaryText="View All Courses"
                            secondaryText="View All Courses"
                            bgColor="#ba1c33"
                            hoverBgColor="#111827"
                            hoverTextColor="white"
                            textColor="white"
                            className="!w-52"
                            href="/courses"
                            icon={<ArrowRight className="w-5 h-5" />}
                        />
                    </div>
                </LayoutGroup>
            </div>
        </div>
    );
}