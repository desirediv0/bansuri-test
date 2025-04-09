"use client";
import { ThumbsUp, Youtube } from "lucide-react";
import CustomButton from "../../_components/CustomButton";
import LearningLanding from "../../_components/LearningLanding";
import CourseHero from "../../_components/CourseHero";
import TestimonialsSection from "../../_components/testimonial/testimonial-section";
import TablaTanpura from "../../_components/TablaTanpura";
import LearningStyle from "../../_components/courses/learningStyle";
import { HeroSection } from "../../_components/HeroSectionProps";
import { useState } from "react";
import VideoDialog from "../../_components/VideoDialog";
import { scrollToSection } from "../../_components/smoothScroll";
import BatchCards from "./BatchCards";

export default function OfflineBatches() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  return (
    <>
      <HeroSection
        title="Offline Batches"
        description="Embark on your journey to flute mastery with our pre-recorded courses, interactive live classes, and immersive offline batches designed to suit every learner's needs."
        variant="page"
        backgroundImage="/c1.jpg"
        buttons={
          <>
            <CustomButton
              primaryText="Get Started"
              secondaryText="Learn More"
              icon={<ThumbsUp size={20} />}
              onClick={() => scrollToSection("courses-section")}
              className="!px-6 py-3 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-colors w-[200px]"
            />
            <button
              onClick={() => setIsVideoOpen(true)}
              className="group flex items-center justify-center text-white gap-1
              hover:text-white/90 transition-all duration-300 relative
              hover:-translate-x-2"
            >
              <Youtube
                size={20}
                className="transform transition-all duration-300 
                group-hover:translate-x-[-2px]"
              />
              <span>How it works</span>
            </button>
          </>
        }
        stats={[
          { number: "260+", label: "Tutors", endValue: 260 },
          { number: "9000+", label: "Students", endValue: 9000 },
          { number: "500+", label: "Courses", endValue: 500 }
        ]}
      />
      <VideoDialog
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      />
      <section id="courses-section" className="max-w-7xl mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Available Batches</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Choose from our carefully designed batch programs tailored for different skill levels and flute types.
          </p>
          <div className="w-24 h-1 bg-[#ba1c33] mx-auto mt-6"></div>
        </div>
        <BatchCards />
      </section>
      <LearningLanding />
      <main className="min-h-screen bg-[#F3F8F8] px-5 pb-6">
        <LearningStyle />
      </main>
      <div>
        <CourseHero />
      </div>
      <TestimonialsSection />
      <TablaTanpura />
    </>
  );
}
