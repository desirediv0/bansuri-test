import React from 'react';
import ReactPlayer from 'react-player';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from 'lucide-react';

interface FreeChapterDialogProps {
    isOpen: boolean;
    onClose: () => void;
    chapterTitle: string;
    videoUrl: string | null;
    isLoading: boolean;
    error: boolean | string;
}

const FreeChapterDialog: React.FC<FreeChapterDialogProps> = ({
    isOpen,
    onClose,
    chapterTitle,
    videoUrl,
    isLoading,
    error
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{chapterTitle}</DialogTitle>
                </DialogHeader>
                <div className="aspect-video relative rounded-lg overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full bg-gray-100">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#610981]" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full bg-gray-100 p-4">
                            <AlertTriangle className="h-12 w-12 text-yellow-500 mb-2" />
                            <p className="text-center text-gray-600">{error}</p>
                        </div>
                    ) : videoUrl ? (
                        <ReactPlayer
                            url={videoUrl}
                            width="100%"
                            height="100%"
                            controls
                            playing
                        />
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default FreeChapterDialog;