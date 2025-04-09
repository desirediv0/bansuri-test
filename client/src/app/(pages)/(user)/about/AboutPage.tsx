'use client'

import {  Award  } from 'lucide-react'
import Image from 'next/image'
import { AnimatedText } from '../../_components/AnimatedText'
import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'


const data = [
  {
    title: "Skilled instructors",
    description: "Best online platform for professional courses.",
    icon: "/icon/f1.webp",
    btnText: "STUDENT ENROLLMENT",
    btnHover: "Great Instructors",
    href: "/",
  },
  {
    title: "Educator helps",
    description: "Best online platform for professional courses.",
    icon: "/icon/f2.webp",
    btnText : "STATISFACTION RATE",
    btnHover: "Student Feedback",
    href: "/",
  },
  {
    title: "Get certificate",
    description: "Best online platform for professional courses.",
    icon: "/icon/f3.webp",
    btnText: "STUDENT ENROLLMENT",
    btnHover: "Explore Courses",
    href: "/",
  },
  {
    title: "Online classes",
    description: "Best online platform for professional courses.",
    icon: "/icon/f4.webp",
    btnText: "TOP INSTRUCTORS",
    btnHover: "Popular Courses",
    href: "/",
  }
]

export default function AboutPage() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  return (
    <div className="relative overflow-hidden bg-white">
      <div className="container mx-auto px-4 py-12 md:py-24">
        <div className="grid gap-8 md:gap-16 lg:grid-cols-2 px-4 md:px-8 xl:px-20">
          {/* Left Column */}
          <motion.div 
            className="flex flex-col justify-center space-y-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Image
                src="/l-1.png"
                alt="Decorative Image 1"
                width={100}
                height={100}
                className="absolute top-0 left-0 h-auto w-64 md:w-96 z-10"
              />
            </motion.div>

            <motion.div 
              className="flex w-fit items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex p-4 items-center justify-center rounded-full bg-[#ba1c33]">
                <Award size={24} color="#fff" />
              </div>
              <AnimatedText
                text="About Us"
                className="text-lg font-medium text-[#107D6C]"
                delay={0.5}
              />
            </motion.div>

            <AnimatedText
              text="Harmonizing Tradition with Melody"
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-[var(--custom-green-11)]"
              delay={0.2}
            />

       
          </motion.div>

          {/* Right Column */}
          <motion.div 
            className="relative space-y-8 md:space-y-12 pt-8 lg:pt-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Image
              src="/l-2.png"
              alt="Decorative Image 2"
              width={150}
              height={150}
              className="absolute top-1/2 -right-20 md:-right-56 -translate-y-1/2 h-auto w-60 md:w-80 rotate-[-55deg] opacity-5"
            />
            <div className="flex flex-col space-y-6 md:space-y-8">
              <AnimatedText
                text="Welcome to Bansuri Vidya Mandir"
                className="text-2xl md:text-3xl font-semibold text-gray-800"
                delay={0.4}
              />

              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Bansuri Vidya Mandir is a sacred space where the timeless tunes of the Indian flute meet the rhythm of education. Our institution is dedicated to nurturing musical talent and imparting the profound art of bansuri playing, blending academic excellence, cultural heritage, and spiritual growth.
              </p>
          
            </div>
          </motion.div>
        </div>
      </div>
      {/* <div className="w-full max-w-7xl mx-auto">
      <div className="flex flex-wrap px-4 md:px-8 xl:px-20 py-12">
        {data.map((item, index) => (
          <motion.div
            key={index}
            className={`w-full sm:w-1/2 lg:w-1/4 flex flex-col items-center 
              border-r border-b border-gray-200 group
              ${(index + 1) % 4 === 0 ? "lg:border-r-0" : ""}
              ${index >= data.length - 4 ? "lg:border-b-0" : ""}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 * index }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
            <div className="flex items-center justify-center p-4 sm:p-6 bg-[#F7F7F7] rounded-full">
              <Image
                src={item.icon || "/placeholder.svg"}
                alt={item.title}
                width={40}
                height={40}
                className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16"
              />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mt-4 sm:mt-6 text-center">
              {item.title}
            </h3>
            <p className="text-sm sm:text-base text-center text-gray-600 mt-2 sm:mt-4 mb-6">
              {item.description}
            </p>

            <Link 
              href={item.href}
              className="relative mt-auto py-3 w-full text-center font-semibold text-sm sm:text-base
                text-gray-800 group-hover:text-white transition-colors duration-300
                border-t border-b border-gray-300 overflow-hidden tracking-wide"
            >
              <div className="relative z-10">
                {hoveredIndex === index ? item.btnHover : item.btnText}
              </div>
              <div 
                className="absolute left-0 bottom-0 w-full h-0 bg-[#ba1c33] 
                transition-all duration-300 ease-out -z-0
                group-hover:h-full"
              />
            </Link>
          </motion.div>
        ))}
      </div>
    </div> */}
    </div>
  )
}