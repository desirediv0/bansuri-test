"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useState } from "react";

// Import ReactPlayer dynamically to avoid SSR issues
const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

interface VideoDialogProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl: string;
}

export default function VideoDialog({ isOpen, onClose, videoUrl }: VideoDialogProps) {
    const [isPlayerReady, setIsPlayerReady] = useState(false);

    return (
        <AnimatePresence>
            {isOpen && (
                <Dialog open={isOpen} onOpenChange={onClose}>
                    <DialogContent className="sm:max-w-[800px] p-0 bg-black overflow-hidden rounded-lg border-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            className="relative w-full h-0 pb-[56.25%]"
                        >
                            <button
                                onClick={onClose}
                                className="absolute right-2 top-2 z-10 rounded-full bg-black/70 p-2 text-white hover:bg-black/90 transition-all"
                            >
                                <X size={20} />
                            </button>

                            <div className="absolute top-0 left-0 w-full h-full">
                                {!isPlayerReady && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                                        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                                <ReactPlayer
                                    url={videoUrl}
                                    width="100%"
                                    height="100%"
                                    playing={isOpen}
                                    controls={true}
                                    onReady={() => setIsPlayerReady(true)}
                                    config={{
                                        youtube: {
                                            playerVars: {
                                                autoplay: 1,
                                                modestbranding: 1,
                                                rel: 0
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </motion.div>
                    </DialogContent>
                </Dialog>
            )}
        </AnimatePresence>
    );
}
