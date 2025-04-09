import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ChapterDataNew } from "@/type"
import { BookOpen, Calendar, FileText, Download, Play, Pause, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

interface ChapterDetailsProps {
  chapter: ChapterDataNew | null
}

const STORAGE_BASE_URL = "https://desirediv-storage.blr1.digitaloceanspaces.com/";

const formatMediaUrl = (url: string | null | undefined): string | null => {
  if (!url || url === "null" || url === null) return null;
  if (url.startsWith(STORAGE_BASE_URL)) return url;
  if (url.startsWith('/')) return `${STORAGE_BASE_URL}${url.slice(1)}`;
  return `${STORAGE_BASE_URL}${url}`;
};

const PdfViewer = ({ pdfUrl }: { pdfUrl: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const formattedPdfUrl = formatMediaUrl(pdfUrl);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
  }, [pdfUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError("Unable to load PDF. Please try downloading instead.");
  };

  const downloadPdf = () => {
    try {
      if (!formattedPdfUrl) {
        toast.error("PDF URL is not valid");
        return;
      }
      window.open(formattedPdfUrl, '_blank');
    } catch (err) {
      toast.error("Failed to open PDF. Check your internet connection.");
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 relative z-10">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2">
          <FileText className="h-5 w-5" /> PDF Document
        </h3>
        <Button
          size="sm"
          variant="outline"
          className="flex items-center gap-1"
          onClick={downloadPdf}
        >
          <Download className="h-4 w-4" /> Download PDF
        </Button>
      </div>
      <div className="border rounded-md overflow-hidden bg-white shadow-sm relative min-h-[500px] z-10">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <Loader2 className="h-8 w-8 text-red-600 animate-spin" />
            <span className="ml-2 text-gray-700">Loading PDF...</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10 p-4">
            <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
            <p className="text-red-500 mb-4 text-center font-medium">{error}</p>
            <Button onClick={downloadPdf} variant="default">
              Try downloading instead
            </Button>
          </div>
        )}

        {formattedPdfUrl && (
          <iframe
            ref={iframeRef}
            src={formattedPdfUrl}
            className="w-full h-[500px]"
            title="PDF Viewer"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}
      </div>
    </div>
  )
}

const AudioPlayer = ({ audioUrl }: { audioUrl: string }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const formattedAudioUrl = formatMediaUrl(audioUrl);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(err => {
          setError("Failed to play audio. Please try downloading instead.");
        }).then(() => {
          if (audioRef.current) {
            setIsPlaying(true);
          }
        });
      }
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      setIsLoading(false)
    }
  }

  const handleError = () => {
    setIsLoading(false)
    setError("Failed to load audio. Please try downloading instead.")
  }

  const seekAudio = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && !isLoading) {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = pos * duration;
      setCurrentTime(pos * duration);
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }

  const downloadAudio = () => {
    try {
      if (!formattedAudioUrl) {
        toast.error("Audio URL is not valid");
        return;
      }
      window.open(formattedAudioUrl, '_blank');
    } catch (err) {
      toast.error("Failed to open audio. Check your internet connection.");
    }
  };

  useEffect(() => {
    // Reset state when URL changes
    setIsLoading(true);
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [audioUrl, formattedAudioUrl])

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2">
          <Play className="h-5 w-5" /> Audio Material
        </h3>
        <Button
          size="sm"
          variant="outline"
          className="flex items-center gap-1"
          onClick={downloadAudio}
        >
          <Download className="h-4 w-4" /> Download Audio
        </Button>
      </div>

      <div className="bg-white border rounded-lg p-4 shadow-sm">
        {formattedAudioUrl && (
          <audio
            ref={audioRef}
            src={formattedAudioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={handleError}
            className="hidden"
            preload="metadata"
          />
        )}

        {error ? (
          <div className="flex flex-col items-center justify-center py-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-red-500 mb-3 font-medium text-center">{error}</p>
            <Button onClick={downloadAudio} size="sm" variant="default">
              <Download className="h-4 w-4 mr-1" /> Download Audio Instead
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className={`h-12 w-12 rounded-full ${isPlaying ? 'bg-red-100 text-red-700 border-red-300' : 'bg-gray-50'}`}
              onClick={togglePlayPause}
              disabled={isLoading || !formattedAudioUrl}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            <div className="flex-1">
              <div
                className="w-full bg-gray-200 rounded-full h-2 mb-1 overflow-hidden cursor-pointer"
                onClick={seekAudio}
              >
                <div
                  className="bg-red-600 h-full rounded-full transition-all"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatTime(currentTime)}</span>
                <span>{isLoading ? "--:--" : formatTime(duration)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const ChapterDetails: React.FC<ChapterDetailsProps> = ({ chapter }) => {
  if (!chapter) {
    return (
      <Card className="bg-white shadow-md p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Chapter Not Found</h2>
        <p className="text-gray-600">The requested chapter could not be loaded.</p>
      </Card>
    );
  }

  // Check if URLs are properly formatted and not null
  const pdfUrl = chapter.pdfUrl && chapter.pdfUrl !== "null" ? formatMediaUrl(chapter.pdfUrl) : null;
  const audioUrl = chapter.audioUrl && chapter.audioUrl !== "null" ? formatMediaUrl(chapter.audioUrl) : null;
  const hasAdditionalContent = !!(pdfUrl || audioUrl);

  return (
    <Card className="bg-gradient-to-br from-white to-red-50/30 overflow-hidden transition-all duration-300 group mx-auto relative shadow-lg z-10">
      <CardHeader className="bg-gradient-to-r from-red-100/50 to-red-50/30 border-b border-red-100 py-8 px-8 font-plus-jakarta-sans">
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="w-6 h-6 text-red-600" />
          <span className="text-sm font-medium text-red-600 bg-red-100 px-3 py-1 rounded-full">
            Chapter {chapter.position || "1"}
          </span>
        </div>
        <CardTitle className="text-xl md:text-2xl font-bold text-gray-800 group-hover:text-red-700 transition-colors duration-300 leading-tight">
          {chapter.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        <div className="border-l-4 border-red-200 pl-4 py-2 bg-red-50/50 rounded-r-md">
          <p className="text-gray-700 leading-relaxed text-base font-inter">{chapter.description}</p>
        </div>

        {hasAdditionalContent && (
          <div className="pt-4">
            {pdfUrl && audioUrl ? (
              <Tabs defaultValue="pdf" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pdf" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> PDF Material
                  </TabsTrigger>
                  <TabsTrigger value="audio" className="flex items-center gap-2">
                    <Play className="h-4 w-4" /> Audio Material
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pdf" className="mt-4">
                  <PdfViewer pdfUrl={pdfUrl} />
                </TabsContent>

                <TabsContent value="audio" className="mt-4">
                  <AudioPlayer audioUrl={audioUrl} />
                </TabsContent>
              </Tabs>
            ) : pdfUrl ? (
              <div className="mt-4">
                <PdfViewer pdfUrl={pdfUrl} />
              </div>
            ) : audioUrl ? (
              <div className="mt-4">
                <AudioPlayer audioUrl={audioUrl} />
              </div>
            ) : null}
          </div>
        )}

        <div className="flex items-center gap-6 text-sm text-gray-600 mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Added on {new Date(chapter.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ChapterDetails

