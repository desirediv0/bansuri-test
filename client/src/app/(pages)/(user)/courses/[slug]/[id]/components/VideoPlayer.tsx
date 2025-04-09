"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import ReactPlayer from "react-player"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import axios from "axios"

interface VideoPlayerProps {
  videoUrl: string | null
  isLoading: boolean
  onProgress: (progress: any) => void
  onDuration: (duration: number) => void
  onEnded: () => void
  className?: string
  initialProgress?: number
  isCompleted?: boolean
  chapterId: string
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  isLoading,
  onProgress,
  onDuration,
  onEnded,
  className,
  initialProgress = 0,
  isCompleted = false,
  chapterId
}) => {
  const playerRef = useRef<ReactPlayer>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [duration, setDuration] = useState(0)
  const [progress, setProgress] = useState(0)
  const [lastReportedProgress, setLastReportedProgress] = useState(0)
  const [showWarning, setShowWarning] = useState(false)

  // Anti-screen recording measures
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPlaying(false)
        setShowWarning(true)
      } else {
        setShowWarning(false)
      }
    }

    const preventScreenCapture = () => {
      if (containerRef.current) {
        containerRef.current.style.setProperty('-webkit-user-select', 'none')
        containerRef.current.style.setProperty('-webkit-touch-callout', 'none')
        containerRef.current.style.setProperty('user-select', 'none')
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent common screenshot shortcuts
      if (
        (e.key === 'PrintScreen') ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault()
        setShowWarning(true)
        setTimeout(() => setShowWarning(false), 2000)
        return false
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      setShowWarning(true)
      setTimeout(() => setShowWarning(false), 2000)
      return false
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('contextmenu', handleContextMenu)
    preventScreenCapture()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])

  useEffect(() => {
    if (playerRef.current && initialProgress > 0 && !hasStarted) {
      playerRef.current.seekTo(initialProgress, "seconds")
      setHasStarted(true)
    }
  }, [initialProgress, hasStarted])

  const handleProgress = (state: {
    played: number
    playedSeconds: number
    loaded: number
    loadedSeconds: number
  }) => {
    const currentProgress = (state.playedSeconds / duration) * 100;
    setProgress(currentProgress);
    onProgress(state);

    // Update progress on server every 5 seconds or when progress changes significantly
    if (Math.abs(currentProgress - lastReportedProgress) > 5) {
      handleTimeUpdate(state.playedSeconds, duration);
      setLastReportedProgress(currentProgress);
    }
  }

  const handleDuration = (duration: number) => {
    setDuration(duration)
    onDuration(duration)
  }

  const handleEnded = () => {
    if (progress >= 80 || isCompleted) {
      onEnded()
    } else {
      toast.error("Please watch at least 80% of the video to complete this chapter")
      if (playerRef.current) {
        playerRef.current.seekTo(0)
      }
    }
  }

  const handleTimeUpdate = async (currentTime: number, duration: number) => {
    if (!duration || !chapterId) return;

    try {
      const progressPercentage = (currentTime / duration) * 100;

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/user-progress/update`,
        {
          chapterId,
          watchedTime: progressPercentage
        },
        {
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update progress');
      }
    } catch (error) {
      console.error("Error updating progress:", error);
      // Optionally show a toast only on significant errors, not every progress update
      if (currentTime % (duration / 4) === 0) { // Show error only at 0%, 25%, 50%, 75%, 100%
        toast.error("Failed to update progress");
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative aspect-video select-none",
        className
      )}
      style={{
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        userSelect: 'none'
      }}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <span className="text-gray-500">Loading video...</span>
        </div>
      ) : (
        <>
          <ReactPlayer
            ref={playerRef}
            url={videoUrl || ""}
            width="100%"
            height="100%"
            controls
            playing={isPlaying && !showWarning}
            onProgress={handleProgress}
            onDuration={handleDuration}
            onEnded={handleEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            config={{
              youtube: {
                playerVars: {
                  modestbranding: 1,
                  rel: 0,
                  showinfo: 0,
                  iv_load_policy: 3,
                  fs: 0,
                  controlsList: 'nodownload noplaybackrate',
                },
                embedOptions: {
                  controls: 1,
                  disablekb: 1,
                  fs: 0,
                }
              },
              file: {
                attributes: {
                  controlsList: 'nodownload',
                  disablePictureInPicture: true,
                  onContextMenu: (e: Event) => e.preventDefault()
                }
              }
            }}
          />
          {showWarning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-white text-center p-4">
              <div>
                <p className="text-lg font-semibold mb-2">⚠️ Warning</p>
                <p>Screen recording and screenshots are not allowed.</p>
                <p className="text-sm mt-2">Please return to the video tab to continue watching.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default VideoPlayer

