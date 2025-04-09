import {
  Phone,
  Instagram,
  Youtube,
} from "lucide-react";
import CustomButton from "./CustomButton";
import Link from "next/link";
import Image from "next/image";

const socialLinks = [
  { icon: Instagram, href: "https://www.instagram.com/bansurividyamandir/" },
  { icon: Youtube, href: "https://www.youtube.com/@bansurividya" },
];

const navLinks = [
  { name: "Terms & Conditions", href: "/" },
  { name: "Refund Policy", href: "/refund" },
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Sitemap", href: "/" }
];

const popularCourses = [
  { name: "Bansuri Basics", href: "/courses/introduction-to-bansuri-basics" },
  { name: "Bansuri Beginners", href: "/courses/bansuri-swara-a-beginners-journey" },
  { name: "Bansuri Intermidiate", href: "/courses/bansuri-tarang-intermediate-course" },
];
const usefullLinks = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/about" },
  { name: "Contact Us", href: "/contact" },
  { name: "All Courses", href: "/courses" },
  { name: "My Account", href: "/login" },
];

function Footer() {
  return (
    <div className="relative">
      {/* Top Banner Section */}
      <div className="md:absolute md:inset-x-0 md:-top-24 z-10">
        <div className="mx-auto md:max-w-6xl md:px-4 ">
          <div className="md:rounded-lg bg-[#ba1c32] shadow-lg">
            <div className="flex flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
              <p className="text-xl font-semibold text-[#fff] block">Still Confused ? Contact us today to know more about us </p>
              {/* </div> */}

              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <CustomButton
                  primaryText="Contact Us"
                  secondaryText="Contact Us"
                  bgColor="#fff"
                  hoverBgColor="#2A3342"
                  hoverTextColor="#fff"
                  textColor="#ba1c32"
                  className="w-48"
                  href="/contact"
                />
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-[#fff]" />
                  <span className="text-base font-medium text-[#fff]">
                    +91 9971145671
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <footer className="md:mt-32 bg-[#000] pt-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">

                <Link href="/">
                  <Image src="/logo.png" alt="logo" width={200} height={100} />
                </Link>
              </div>
              <p className="text-gray-400">
                Our institution is dedicated to nurturing musical talent and imparting the profound art of bansuri playing.
              </p>
              <div className="flex gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <Link
                      key={social.href}
                      href={social.href}
                      className="text-white hover:text-[#ba1c32] transition-colors"
                    >
                      <Icon className="h-5 w-5" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Popular Courses */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white">
                Popular courses
              </h3>
              <ul className="space-y-4">
                {popularCourses.map((course) => (
                  <li key={course.name}>
                    <Link
                      href={course.href}
                      className="text-gray-400 hover:text-[#ba1c32] transition-colors"
                    >
                      {course.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Usefull Links */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white">
                Usefull Links
              </h3>
              <ul className="space-y-4">
                {usefullLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-[#ba1c32] transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Need Help Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white">Need help?</h3>
              <div className="space-y-2">
                <p className="text-gray-400">Call us directly?</p>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">
                    +91 9971145671
                  </span>
                  <span className="rounded-full bg-[#ba1c32] px-2 py-0.5 text-xs font-medium text-[#fff]">
                    FREE
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-gray-400">Need support?</p>
                <Link
                  href="mailto:help@domain.com"
                  className="text-white underline hover:text-[#ba1c32] transition-colors"
                >
                  bansurividya@gmail.com
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="mt-16 border-t border-gray-700 py-8">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <nav>
                <ul className="flex flex-wrap justify-center gap-6">
                  {navLinks.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-gray-400 hover:text-[#ba1c32] transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <p className="text-gray-400 text-center md:text-left">
                © 2025 – Bansuri Vidya Mandir™  . All Rights Reserved. Designed with ❤ by {" "}
                <a
                  href="https://desirediv.com"
                  target="_blank"
                  className="text-white hover:text-[#ba1c32] transition-colors"
                >
                  Desire Div
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Footer;
