import CourseHero from "../../_components/CourseHero";
import { HeroSection } from "../../_components/HeroSectionProps";
import AboutPage from "./AboutPage";

export default function About() {
  return (
    <>
      <HeroSection
        smallText="About Us"
        title="Know more about us."
        variant="page"
        image={{
          src: "/rupak-sir.webp",
          alt: "About us",
        }}
      />
      <AboutPage/>
      <CourseHero />
    </>
  );
}
