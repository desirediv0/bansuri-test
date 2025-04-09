'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Facebook, Instagram, Twitter, Dribbble, Linkedin, Github } from 'lucide-react'
import { useState } from 'react'
import { instructorsData } from './instructorsData'
import Image from 'next/image'
import { AnimatedText } from '../../_components/AnimatedText'

const SocialIcons = ({ socials, isMobile = false }: { socials: any, isMobile?: boolean }) => (
  <motion.div 
    className={`flex gap-4 ${isMobile ? 'justify-center py-4' : 'justify-center'}`}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
    transition={{ duration: 0.2 }}
  >
    {Object.entries(socials).map(([platform, url]) => {
      const Icon = {
        facebook: Facebook,
        instagram: Instagram,
        twitter: Twitter,
        dribbble: Dribbble,
        linkedin: Linkedin,
        github: Github
      }[platform]

      return Icon && (
        <motion.a
          key={platform}
          href={url as string}
          target="_blank"
          rel="noopener noreferrer"
          className={`${isMobile ? 'text-gray-600' : 'text-white'} hover:text-[#ba1c33] transition-colors`}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.95 }}
        >
          <Icon className="w-6 h-6" />
        </motion.a>
      )
    })}
  </motion.div>
)

const CircularProgress = ({ percentage, label , delay= 0.5 }: { percentage: number; label: string , delay?: number}) => {
  const radius = 85
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <motion.div 
        className="relative w-48 h-48"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r={radius}
            className="stroke-[#dcdfe3] fill-none"
            strokeWidth="4"
          />
          <motion.circle
            cx="96"
            cy="96"
            r={radius}
            className="stroke-[#ba1c33] fill-none"
            strokeWidth="4"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            style={{ strokeDasharray: circumference }}
            transition={{ duration: 1, delay: delay }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold">{percentage}%</span>
        </div>
      </motion.div>
      <h3 className="mt-4 text-xl font-medium text-gray-700">{label}</h3>
    </div>
  )
}

const InstructorCard = ({ instructor }: { instructor: typeof instructorsData[0] }) => {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div className="space-y-4">
      <motion.div
        className="relative overflow-hidden rounded-lg"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <Image
            width={400}
            height={600}
          src={instructor.image}
          alt={instructor.name}
          className="w-full aspect-[3/4] object-cover bg-gray-300"
        />
        
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-40 hidden sm:flex items-center justify-center"
            >
              <SocialIcons socials={instructor.socials} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900">{instructor.name}</h3>
        <p className="text-gray-500">{instructor.role}</p>
      </div>

      <div className="sm:hidden">
        <SocialIcons socials={instructor.socials} isMobile />
      </div>

    
    </div>
  )
}

export default function InstructorSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="space-y-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full   bg-[#ba1c33] flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                fill="currentColor"
              />
            </svg>
          </div>
          <AnimatedText
            text="Experienced instructors"
            className="text-xl font-medium text-gray-900"
            />
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <AnimatedText
            text='We have amazing skills for teaching.'
            className='text-5xl font-bold text-gray-900 leading-tight'
            delay={0}
            />

            <p className='text-lg text-gray-500'>
              Our instructors bring years of industry experience and expertise to help you succeed.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            <CircularProgress percentage={95} label="Teaching Experience" />
            <CircularProgress percentage={98} label="Student Success Rate" delay={0.7}/>
          </div>
        </div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {instructorsData.map((instructor) => (
            <InstructorCard key={instructor.id} instructor={instructor} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}