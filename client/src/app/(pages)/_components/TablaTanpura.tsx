"use client";

import { AccordionItem } from "@/components/AccordionItem";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  GraduationCap,
  Users,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import CustomButton from "./CustomButton";
import { InfiniteTextScroll } from "@/components/infinite-text-scroll";
import { AnimatedText } from "./AnimatedText";

export default function TablaTanpura() {
  const [openId, setOpenId] = useState<string | null>("1");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });
  };

  const calculateTilt = () => {
    const tiltX = (mousePosition.y - 0.5) * 20;
    const tiltY = (mousePosition.x - 0.5) * -20;
    return `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  };

  return (
    <div>
      <div className="p-8 md:p-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            {/* Right Column */}
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <div className="bg-[#ba1c33] p-4 rounded-full">
                <Briefcase className="w-6 h-6 text-[#fff]" />
              </div>

              <AnimatedText
                text="Enhance your Musical Journey"
                className="text-lg text-gray-700"
              />
            </div>
            <AnimatedText
              text="Practice with Tabla and Tanpura"
              className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight"
            />
            {/* <AnimatedText
              text="Ready to enhance your skills and dive deeper into the world of Indian classical music? Our Tabla and Tanpura Practice Tool is here to help you master rhythm and pitch with ease. Whether you’re just beginning or looking to refine your technique, this interactive tool is perfect for students like you"
              className="text-md md:text-md text-gray-800 leading-tight"
            /> */}
            <p className="text-lg md:text-md text-gray-800 leading-tight">Ready to enhance your skills and dive deeper into the world of Indian classical music? Our Tabla and Tanpura Practice Tool is here to help you master rhythm and pitch with ease. Whether you’re just beginning or looking to refine your technique, this interactive tool is perfect for students like you</p>

            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {/* <div className="space-y-4">
                {accordionItems.map((item) => (
                  <AccordionItem
                    key={item.id}
                    title={item.title}
                    content={item.content}
                    icon={item.icon}
                    isOpen={openId === item.id}
                    onToggle={() =>
                      setOpenId(openId === item.id ? null : item.id)
                    }
                  />
                ))}
              </div> */}

              <CustomButton
                primaryText="Coming Soon"
                secondaryText="Coming Soon"
                bgColor="#ba1c33"
                hoverBgColor="#111827"
                hoverTextColor="white"
                textColor="white"
                className="!w-52"
                icon={<ArrowRight className="w-5 h-5" />}
              />
            </motion.div>
          </div>
          {/* Left Column */}
          <motion.div
            className="relative w-full flex justify-center"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setMousePosition({ x: 0, y: 0 })}
            style={{
              transform: calculateTilt(),
              // transformStyle: "preserve-3d",
              transition: "transform 0.3s ease-out",
            }}
          >
            {/* Decorative Shape */}
            {/* <motion.div
              className="absolute top-10 left-10 w-3/4 h-3/4 z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              style={{ transform: "translateZ(50px)" }}
            >
              <Image
                src="/manjeet-sir1.webp"
                alt="Decorative shape"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
                priority
              />
            </motion.div> */}

            {/* Main Image */}
            <motion.div
              className="relative z-20 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ transform: "translateZ(100px)" }}
            >
              <Image
                src="/tabla-tanpura.png"
                alt="Course instructor"
                width={400}
                height={400}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
                priority
              />
            </motion.div>
          </motion.div>

          
        </div>
      </div>
      {/* <InfiniteTextScroll
        text="Online learning wherever and whenever"
        content="Transform your future with our online courses"
        speed={25}
      /> */}
    </div>
  );
}

const accordionItems = [
  {
    id: "1",
    title: "Master the skills that matter to you",
    content: "Web-based training you can consume at your own pace.",
    icon: (
      <div className="p-2 rounded-lg bg-gray-100">
        <BookOpen size={70} />
      </div>
    ),
  },
  {
    id: "2",
    title: "Connect with effective methods",
    content:
      "Web-based training you can consume at your own pace. Courses are interactive.",
    icon: (
      <div className="p-2 rounded-lg bg-gray-100">
        <Users size={70} />
      </div>
    ),
  },
  {
    id: "3",
    title: "Increase your learning skills",
    content: "Develop your expertise through structured learning paths.",
    icon: (
      <div className="p-2 rounded-lg bg-gray-100">
        <GraduationCap size={70} />
      </div>
    ),
  },
];
