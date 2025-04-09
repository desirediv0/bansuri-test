"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from 'lucide-react';
import { VideoModalProps } from "@/type";


export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  title,
  content,
}) => {

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const getYoutubeVideoId = (url: string) => {
    if (url.includes('shorts')) {
      return url.split('/').pop();
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            layoutId="play-button"
            className="bg-white rounded-lg overflow-hidden w-full max-w-2xl h-[60vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-[inherit]">
              <div>
                {/* <div className="relative aspect-video"> */}
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${getYoutubeVideoId(videoUrl)}?autoplay=1`}
                  title={title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full"
                ></iframe>
              </div>
              <div className="px-5 py-10 flex items-center">
                <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2">{title}</h2>
                <p className="text-sm sm:text-base text-gray-600">
                  {content}
                </p>
                </div>
              </div>
            </div>
            <button
              className="absolute top-2 right-2 p-2 bg-white rounded-full"
              onClick={onClose}
            >
              <X className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

