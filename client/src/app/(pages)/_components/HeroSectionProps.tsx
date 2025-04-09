"use client";

import { AnimatedDots } from "./AnimatedDots";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCountAnimation } from "./useCountAnimation";
import { HeroSectionProps } from "@/type";
import { useState } from "react";
import { motion } from "framer-motion";
import { AnimatedText } from "./AnimatedText";

export function HeroSection({
  smallText,
  title,
  description,
  image,
  backgroundColor = "#000",
  backgroundImage,
  buttons,
  stats,
  className,
  scale,
  variant = "page",
}: HeroSectionProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (variant !== "home") return;
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

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden w-full",
        variant === "home" ? "lg:min-h-screen" : "h-[400px] md:h-[500px]",
        className
      )}
      style={{ backgroundColor }}
    >
      {backgroundImage && (
        <div className="absolute inset-0 z-0 w-full h-full">
          <Image
            src={backgroundImage}
            alt="Background"
            layout="fill"
            objectFit="cover"
            className="opacity-60"
            priority
          />
        </div>
      )}

      <AnimatedDots />

      <div className="container relative mx-auto px-4 h-full xl:px-20">
        <div
          className={cn(
            "flex flex-col h-full px-3 md:px-10",
            variant === "home"
              ? "lg:flex-row pt-16 md:pt-20 lg:pt-16 pb-8 md:pb-12 items-center justify-center lg:items-end lg:pb-16"
              : "pt-16 md:pt-20 pb-8 items-center justify-center text-center"
          )}
        >
          {image && variant === "home" && (
            <div className="absolute inset-0 z-0 lg:hidden w-full">
              <Image
                src={image.src}
                alt={image.alt}
                layout="fill"
                objectFit="cover"
                className="opacity-30"
                priority
              />
            </div>
          )}
          <div
            className={cn(
              "space-y-4 md:space-y-6 pt-6 md:pt-8 z-10",
              variant === "home"
                ? "w-full lg:w-1/2 lg:max-w-3xl text-center lg:text-left"
                : "w-full max-w-3xl text-center"
            )}
          >
            {smallText && (
              <AnimatedText
                text={smallText}
                className="text-lg md:text-xl text-[#fff] font-medium mb-4"
                delay={0}
              />
            )}
            <h1 className={cn(
              "font-bold text-white leading-tight mt-10 md:mt-20",
              variant === "home"
                ? "text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
                : "text-3xl md:text-5xl lg:text-6xl"
            )}>{title}</h1>
            {description && (
              <p className="mt-6 text-base sm:text-lg md:text-xl text-white/80 max-w-2xl mx-auto lg:mx-0">{description}</p>
            )}
            {buttons && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
                className={cn(
                  "mt-8 flex flex-wrap gap-5",
                  variant === "home"
                    ? "justify-center lg:justify-start"
                    : "justify-center"
                )}
              >
                {buttons}
              </motion.div>
            )}
            {stats && variant === "home" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
                className="mt-16 grid grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto lg:mx-0"
              >
                {stats.map((stat) => (
                  <StatCounter key={stat.label} {...stat} />
                ))}
              </motion.div>
            )}
          </div>
          {image && variant === "home" && (
            <div
              className={cn(
                "w-full relative",
                "lg:w-1/2 h-[500px] lg:h-[600px] -mb-24 ml-0 lg:ml-24",
                "hidden lg:flex items-end justify-center lg:justify-end"
              )}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <div
                className={cn(
                  "relative w-full h-full",
                  variant === "home" && "hover:scale-110"
                )}
                style={{
                  transform: variant === "home" ? calculateTilt() : undefined,
                  transformStyle: "preserve-3d",
                  transition: "all 0.3s ease-out",
                }}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={900}
                  height={900}
                  className={cn(
                    `object-contain w-full h-full scale-${scale}`,
                    variant === "home" && "transition-all duration-300"
                  )}
                  priority
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCounter({ label, endValue }: { label: string; endValue: number }) {
  const count = useCountAnimation(endValue);
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{count}+</div>
      <div className="text-xs sm:text-sm md:text-base text-white/60 mt-2">{label}</div>
    </div>
  );
}

