"use client";

import { Dot } from "@/type";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function AnimatedDots() {
  const [dots, setDots] = useState<Dot[]>([]);

  useEffect(() => {
    const generateDots = () => {
      const newDots: Dot[] = [];
      const numDots = Math.floor(
        (window.innerWidth * window.innerHeight) / 30000
        
      );

      for (let i = 0; i < numDots; i++) {
        newDots.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
        });
      }
      setDots(newDots);
    };

    generateDots();
    window.addEventListener("resize", generateDots);
    return () => window.removeEventListener("resize", generateDots);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className="absolute w-1.5 h-1.5 bg-[#ff7388] rounded-full"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
          }}
          animate={{
            x: [20, -20],
            scale: [1, 1.5],
            opacity: [0.2, 0.4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
            delay: Math.random() * 2,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(186,28,51,0.3)_1px,transparent_1px)] bg-[size:120px_80px]" />
    </div>
  );
}
