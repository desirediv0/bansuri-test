"use client";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import React, { useRef } from "react";

interface AnimatedTextProps {
  text?: string;
  html?: React.ReactNode;
  className?: string;
  delay?: number;
}


const defaultAnimations = {
  hidden: {
    opacity: 0,
    y: 20,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  },
};

const containerVariants = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function AnimatedText({
  text,
  html,
  className,
  delay = 0,
}: AnimatedTextProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    amount: 0.5,
    margin: "-10% 0px -10% 0px"
  });

  // Helper function to wrap words in motion.span
  const wrapWordsInMotion = (content: string) => {
    return content.split(' ').map((word, i) => (
      <motion.span
        key={i}
        className="inline-block mr-2"
        variants={{
          hidden: {
            ...defaultAnimations.hidden,
            transition: {
              duration: 0.5,
              ease: "easeOut",
              delay: i * 0.1 + delay,
            },
          },
          visible: {
            ...defaultAnimations.visible,
            transition: {
              duration: 0.5,
              ease: "easeOut",
              delay: i * 0.1 + delay,
            },
          },
        }}
      >
        {word}
      </motion.span>
    ));
  };

  // If HTML content is provided
  if (html) {
    return (
      <motion.div
        ref={ref}
        className={className}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={containerVariants}
      >
        {React.Children.map(html, (child) => {
          if (typeof child === 'string') {
            return wrapWordsInMotion(child);
          }
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              ...child.props,
              children: typeof child.props.children === 'string'
                ? wrapWordsInMotion(child.props.children)
                : React.Children.map(child.props.children, (nestedChild) =>
                  typeof nestedChild === 'string'
                    ? wrapWordsInMotion(nestedChild)
                    : nestedChild
                ),
            });
          }
          return child;
        })}
      </motion.div>
    );
  }

  // If text content is provided
  const words = text?.split(" ") || [];
  return (
    <motion.div
      ref={ref}
      className={cn("", className)}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-2"
          variants={{
            hidden: {
              ...defaultAnimations.hidden,
              transition: {
                duration: 0.5,
                ease: "easeOut",
                delay: i * 0.1 + delay,
              },
            },
            visible: {
              ...defaultAnimations.visible,
              transition: {
                duration: 0.5,
                ease: "easeOut",
                delay: i * 0.1 + delay,
              },
            },
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}