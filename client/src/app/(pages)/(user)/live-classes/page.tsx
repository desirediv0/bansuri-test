"use client";
import { ThumbsUp, Youtube, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import CustomButton from "../../_components/CustomButton";
import { HeroSection } from "../../_components/HeroSectionProps";
import VideoDialog from "../../_components/VideoDialog";
import { scrollToSection } from "../../_components/smoothScroll";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/helper/AuthContext";
import ClassCard from "./components/ClassCard";
import { useRouter } from "next/navigation";

export default function LiveClasses() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom/sessions?includeAll=true`,
        { withCredentials: true }
      );
      setClasses(response.data.data);
    } catch (error) {
      console.error("Error fetching live classes:", error);
      toast({
        title: "Error",
        description: "Failed to load live classes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <HeroSection
        title="Live Classes"
        description="Embark on your journey to flute mastery with our pre-recorded courses, interactive live classes, and immersive offline batches designed to suit every learner's needs."
        variant="page"
        backgroundImage="/live-classes-bg.jpg"
        buttons={
          <>
            <CustomButton
              primaryText="Get Started"
              secondaryText="Learn More"
              icon={<ThumbsUp size={20} />}
              onClick={() => scrollToSection("classes-section")}
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

      <div className="bg-gradient-to-b from-[#F8F9FA] to-[#F3F8F8] py-16">
        <motion.div
          id="classes-section"
          className="container mx-auto px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold mb-4 text-gray-800 relative inline-block">
              Live Classes
              <motion.div
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 h-1 bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "80%" }}
                transition={{ duration: 0.5, delay: 0.5 }}
              />
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join our expert instructors for live interactive sessions designed to enhance your flute playing skills. Reserve your spot today!
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center items-center min-h-[60vh]">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-12 w-12 text-primary" />
              </motion.div>
            </div>
          ) : !isAuthenticated ? (
            <motion.div
              className="bg-white/80 backdrop-blur-sm p-10 rounded-xl shadow-lg max-w-2xl mx-auto border border-gray-100"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Please Login</h2>
              <p className="mb-6 text-gray-600">To view and join our live classes, you'll need to be logged in to your account.</p>
              <motion.button
                className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  router.push("/auth");
                }}
                transition={{ duration: 0.2 }}
              >
                Sign In
              </motion.button>
            </motion.div>
          ) : classes.length === 0 ? (
            <motion.div
              className=" p-10 max-w-2xl mx-auto "
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-2xl font-bold mb-4 text-gray-800">No Classes Available</h2>
              <p className="mb-2 text-gray-600">There are no upcoming live classes at the moment.</p>
              <p className="text-gray-500">Please check back soon as we regularly update our schedule with new classes.</p>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {classes.map((classItem, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <ClassCard
                    classData={classItem}
                    onPurchase={fetchClasses}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
