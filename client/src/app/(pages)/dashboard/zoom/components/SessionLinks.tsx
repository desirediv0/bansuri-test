"use client";

import { useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Link2,
  ExternalLink,
  Send,
  Check,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface ZoomLiveClass {
  id: string;
  title: string;
  startTime: string;
  isActive: boolean;
  zoomLink: string | null;
  zoomMeetingId: string | null;
  zoomPassword: string | null;
  subscriptions?: { userId: string }[];
  slug: string;
}

interface SessionLinksProps {
  sessions?: ZoomLiveClass[];
  classes?: ZoomLiveClass[];
  refreshData: () => void;
}

export default function SessionLinks({
  sessions,
  classes,
  refreshData,
}: SessionLinksProps) {
  const [activating, setActivating] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ZoomLiveClass | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // Use sessions if provided, otherwise use classes
  const allSessions = sessions || classes || [];

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const handleActivateLinks = async (session: ZoomLiveClass) => {
    if (!session.isActive) {
      toast({
        title: "Error",
        description: "Cannot activate links for inactive classes",
        variant: "destructive",
      });
      return;
    }

    setSelectedSession(session);
    setConfirmDialogOpen(true);
  };

  const confirmActivation = async () => {
    if (!selectedSession) return;

    setActivating(selectedSession.id);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/class/${selectedSession.id}/activate`,
        {},
        { withCredentials: true }
      );

      toast({
        title: "Success",
        description: `Links activated and notifications sent to ${response.data.data.notificationsCount} users.`,
      });

      refreshData();
    } catch (error) {
      console.error("Error activating class links:", error);
      toast({
        title: "Error",
        description: "Failed to activate class links",
        variant: "destructive",
      });
    } finally {
      setActivating(null);
      setConfirmDialogOpen(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Filter for active sessions that are in the future
  const activeUpcomingClasses =
    allSessions.filter(
      (session) => session.isActive && new Date(session.startTime) > new Date()
    ) || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Class Links Management
        </h3>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class Title</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Link Status</TableHead>
              <TableHead>Registrations</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeUpcomingClasses.length > 0 ? (
              activeUpcomingClasses.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.title}</TableCell>
                  <TableCell>{formatDate(session.startTime)}</TableCell>
                  <TableCell>
                    {session.zoomLink ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1 w-fit">
                        <Check size={12} />
                        <span>Active</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-amber-600 border-amber-600 flex items-center gap-1 w-fit"
                      >
                        <AlertTriangle size={12} />
                        <span>Not Generated</span>
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {session.subscriptions?.length || 0} users
                  </TableCell>
                  <TableCell className="space-x-2">
                    {session.zoomLink ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => window.open(session.zoomLink!, "_blank")}
                      >
                        <ExternalLink size={14} />
                        Test Link
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => handleActivateLinks(session)}
                        disabled={!!activating}
                      >
                        {activating === session.id ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <Link2 size={14} />
                        )}
                        Activate Links
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => handleActivateLinks(session)}
                      disabled={!session.zoomLink || !!activating}
                    >
                      <Send size={14} />
                      Resend Notifications
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No active upcoming classes found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Class Links</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate Zoom meeting links for "
              {selectedSession?.title}" and notify all registered users. Are you
              sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmActivation}>
              Activate Links
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
