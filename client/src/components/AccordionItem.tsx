"use client";

import { AccordionItemProps } from "@/type";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { AnimatedText } from "@/app/(pages)/_components/AnimatedText";

export function AccordionItem({
  title,
  content,
  icon,
  isOpen,
  onToggle,
}: AccordionItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white via-white to-[#EB2020]/5 rounded-lg max-w-[450px] w-full mb-5 relative overflow-hidden"
    >
      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full flex justify-between items-center py-5 px-6 text-left"
      >
        <span className="text-xl font-medium text-gray-800">{title}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </motion.button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 relative">
              {/* <AnimatedText
                text={content}
                className="text-gray-600 text-lg md:text-xl pr-16"
              /> */}
              <p className="text-md max-w-2xl mx-auto lg:mx-0">{content}</p>
              <div
                className="absolute right-2 -bottom-2 text-8xl md:text-9xl opacity-10"
                style={{ transform: "rotate(-45deg)" }}
              >
                {icon}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
