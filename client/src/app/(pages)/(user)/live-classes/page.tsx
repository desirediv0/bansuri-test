"use client";
import { ThumbsUp, Youtube, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import CustomButton from "../../_components/CustomButton";
import { HeroSection } from "../../_components/HeroSectionProps";
import VideoDialog from "../../_components/VideoDialog";
import { scrollToSection } from "../../_components/smoothScroll";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/helper/AuthContext";
import ClassCard from "./components/ClassCard";

export default function LiveClasses() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/classes?includeAll=true`;

      console.log("Fetching classes from:", apiUrl);
      const response = await axios.get(apiUrl);

      const classesData = response.data.data;
      console.log(`Received ${classesData.length} classes`);

      // Validate that each class has either id or slug for navigation
      const validatedClasses = classesData.map((classItem: any) => {
        if (!classItem.id && !classItem.slug) {
          console.warn("Class missing both ID and slug:", classItem.title);
        }
        return classItem;
      });

      setClasses(validatedClasses);
    } catch (error: any) {
      console.error("Error fetching live classes:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to load live classes. Please try again.";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <HeroSection
        title="Live Classes"
        description="Embark on your journey to flute mastery with our pre-recorded courses, interactive live classes, and immersive offline batches designed to suit every learner's needs."
        variant="page"
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
          { number: "500+", label: "Courses", endValue: 500 },
        ]}
      />
      <VideoDialog
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      />

      <div className="bg-gradient-to-b from-[#F8F9FA] to-[#F3F8F8] py-16">
        <div id="classes-section" className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-gray-800 relative inline-block">
              Live Classes
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 h-1 bg-primary rounded-full w-4/5" />
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join our expert instructors for live interactive sessions designed
              to enhance your flute playing skills. Reserve your spot today!
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center min-h-[60vh]">
              <div className="animate-spin">
                <Loader2 className="h-12 w-12 text-primary" />
              </div>
            </div>
          ) : classes.length === 0 ? (
            <div className="p-10 max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                No Classes Available
              </h2>
              <p className="mb-2 text-gray-600">
                There are no upcoming live classes at the moment.
              </p>
              <p className="text-gray-500">
                Please check back soon as we regularly update our schedule with
                new classes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {classes.map((classItem, idx) => (
                <div key={idx} className="mb-6">
                  <ClassCard
                    classData={classItem}
                    isAuthenticated={isAuthenticated}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
