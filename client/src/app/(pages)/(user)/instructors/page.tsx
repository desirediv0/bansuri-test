import React from "react";
import { HeroSection } from "../../_components/HeroSectionProps";
import InstructorSection from "./InstructorSection";

const Instructors = () => {
  return (
    <>
      <HeroSection
        smallText="Instructors"
        title="Meet our instructors."
        variant="page"
        image={{
          src: "/rupak-sir.webp",
          alt: "Instructor teaching",
        }}
      />
      <InstructorSection />
    </>
  );
};

export default Instructors;
