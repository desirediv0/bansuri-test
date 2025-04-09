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

export default function CourseHero() {
  const [openId, setOpenId] = useState<string | null>("1");
  // const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
  //   const rect = e.currentTarget.getBoundingClientRect();
  //   const x = (e.clientX - rect.left) / rect.width;
  //   const y = (e.clientY - rect.top) / rect.height;
  //   setMousePosition({ x, y });
  // };

  // const calculateTilt = () => {
  //   const tiltX = (mousePosition.y - 0.5) * 20;
  //   const tiltY = (mousePosition.x - 0.5) * -20;
  //   return `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  // };

  return (
    <div>
      <div className="min-h-screen p-8 md:p-20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          {/* <motion.div
            className="relative w-full aspect-square"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setMousePosition({ x: 0, y: 0 })}
            style={{
              transform: calculateTilt(),
              // transformStyle: "preserve-3d",
              transition: "transform 0.3s ease-out",
            }}
          >
            
            <motion.div
              className="relative z-20 overflow-hidden aspect-square"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ transform: "translateZ(100px)" }}
            >
              <Image
                src="/about.png"
                fill
                alt="Course instructor"
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
                priority
                
              />
            </motion.div>
          </motion.div> */}
          <div className="">
            <Image src="/about.png" width={700} height={700} alt="Pt. Manjeet Singh"
            className="mx-auto" 
            />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <div className="bg-[#ba1c33] p-4 rounded-full">
                <Briefcase className="w-6 h-6 text-[#fff]" />
              </div>

              <AnimatedText
                text="About Instructor"
                className="text-lg text-gray-700"
              />
            </div>
            <AnimatedText
              text="About Pt. Manjeet Singh"
              className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight"
            />
            <p className="mt-6 text-lg max-w-2xl mx-auto lg:mx-0">Pt. Manjeet Singh is a celebrated bansuri virtuoso, trained under the esteemed Pt. Rupak Kulkarni, a disciple of the legendary Pt. Hariprasad Chaurasia. With years of rigorous practice, he has crafted a unique style blending technical precision with soulful expression. As the founder of Bansuri Vidya Mandir, he is committed to nurturing the next generation of flute players through innovative teaching methods, including pre-recorded courses, interactive live classes, and offline batches.</p>

            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="space-y-4">
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
              </div>

              <CustomButton
                primaryText="Know More"
                secondaryText="Know More"
                bgColor="#ba1c33"
                hoverBgColor="#111827"
                hoverTextColor="white"
                textColor="white"
                className="!w-52"
                href="https://www.manjeetsinghflute.com"
                icon={<ArrowRight className="w-5 h-5" />}
              />
            </motion.div>
          </div>
        </div>
      </div>
      <InfiniteTextScroll
        text="Bansuri Speaks Where Words Fail"
        content="Bansuri Speaks Where Words Fail"
        speed={25}
      />
    </div>
  );
}

const accordionItems = [
  {
    id: "1",
    title: "Mastery in Hindustani Classical Music",
    content: "Influenced by the rich traditions of Hindustani classical music, his playing 	resonates with purity and depth.",
    icon: (
      <div className="p-2 rounded-lg bg-gray-100">
        <BookOpen size={70} />
      </div>
    ),
  },
  {
    id: "2",
    title: "Visionary Founder of Bansuri Vidya Mandir",
    content:
      "Established to offer comprehensive flute training, blending technical skills with aesthetic learning.",
    icon: (
      <div className="p-2 rounded-lg bg-gray-100">
        <Users size={70} />
      </div>
    ),
  },
  {
    id: "3",
    title: "Dedicated Mentor and Performer",
    content: "Known for his inspiring mentorship, Pt. Manjeet Singh fosters a passion for the bansuri, continuing the legacy of his gurus.",
    icon: (
      <div className="p-2 rounded-lg bg-gray-100">
        <GraduationCap size={70} />
      </div>
    ),
  },
];
