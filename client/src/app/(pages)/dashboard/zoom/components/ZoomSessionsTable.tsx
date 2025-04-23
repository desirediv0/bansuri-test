"use client";

import { useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
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
  Send,
  Edit,
  Trash2,
  Users,
  ChevronDown,
  ChevronUp,
  Layers,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Type definitions
interface User {
  id: string;
  name: string;
  email: string;
}

interface Module {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  position: number;
  isFree: boolean;
}

interface ZoomSession {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  price: number;
  registrationFee: number;
  courseFee: number;
  isActive: boolean;
  hasModules: boolean;
  isFirstModuleFree: boolean;
  currentRange?: string;
  currentOrientation?: string;
  thumbnailUrl?: string | null;
  subscribedUsers?: User[];
  modules?: Module[];
}

interface ZoomSessionsTableProps {
  sessions: ZoomSession[];
  refreshData: () => void;
}

export default function ZoomSessionsTable({
  sessions,
  refreshData,
}: ZoomSessionsTableProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedSessions, setExpandedSessions] = useState<{
    [key: string]: boolean;
  }>({});
  const { toast } = useToast();

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const handleSendReminders = async (sessionId: string): Promise<void> => {
    setIsLoading(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom/admin/session/${sessionId}/send-reminders`,
        {},
        { withCredentials: true }
      );
      toast({
        title: "Success",
        description: "Reminders sent successfully",
      });
    } catch (error) {
      console.error("Error sending reminders:", error);
      toast({
        title: "Error",
        description: "Failed to send reminders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (sessionId: string) => {
    setExpandedSessions((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead></TableHead>
          <TableHead>Thumbnail</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Start Time</TableHead>
          <TableHead>End Time</TableHead>
          <TableHead>Reg. Fee</TableHead>
          <TableHead>Course Fee</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Subscribers</TableHead>
          <TableHead>Modules</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => (
          <>
            <TableRow key={session.id}>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(session.id)}
                  disabled={!session.hasModules || !session.modules?.length}
                  className={!session.hasModules ? "opacity-0" : ""}
                >
                  {expandedSessions[session.id] ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </Button>
              </TableCell>
              <TableCell>
                {session.thumbnailUrl ? (
                  <div className="relative w-12 h-12 rounded-md overflow-hidden">
                    <Image
                      src={session.thumbnailUrl}
                      alt={session.title}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                    No image
                  </div>
                )}
              </TableCell>
              <TableCell>
                {session.title}
                {session.hasModules && (
                  <div className="text-xs text-muted-foreground flex items-center mt-1">
                    <Layers size={12} className="mr-1" />
                    {session.modules?.length || 0} modules
                    {session.isFirstModuleFree && (
                      <Badge
                        variant="outline"
                        className="ml-2 bg-green-50 text-green-700 text-[10px] py-0 px-1"
                      >
                        Free first module
                      </Badge>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell>{formatDate(session.startTime)}</TableCell>
              <TableCell>{formatDate(session.endTime)}</TableCell>
              <TableCell>₹{session.registrationFee}</TableCell>
              <TableCell>₹{session.courseFee}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    session.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {session.isActive ? "Active" : "Inactive"}
                </span>
              </TableCell>
              <TableCell>{session.subscribedUsers?.length || 0}</TableCell>
              <TableCell>{session.modules?.length || 0}</TableCell>
              <TableCell className="flex space-x-2">
                <Link href={`/dashboard/zoom/edit/${session.id}`}>
                  <Button variant="outline" size="sm" title="Edit Live Class">
                    <Edit size={16} />
                  </Button>
                </Link>
                <Link href={`/dashboard/zoom/delete/${session.id}`}>
                  <Button variant="outline" size="sm" title="Delete Live Class">
                    <Trash2 size={16} />
                  </Button>
                </Link>
                <Link href={`/dashboard/zoom/attendees/${session.id}`}>
                  <Button variant="outline" size="sm" title="View Attendees">
                    <Users size={16} />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendReminders(session.id)}
                  disabled={isLoading}
                  title="Send Reminders"
                >
                  <Send size={16} />
                </Button>
              </TableCell>
            </TableRow>
            {/* Expanded modules row */}
            {expandedSessions[session.id] &&
              session.hasModules &&
              session.modules && (
                <TableRow className="bg-gray-50">
                  <TableCell colSpan={10} className="p-0">
                    <div className="p-4">
                      <h4 className="text-sm font-semibold mb-2">Modules</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {session.modules.map((module, index) => (
                          <div
                            key={module.id}
                            className="border rounded p-3 bg-white"
                          >
                            <div className="flex justify-between">
                              <div className="font-medium">{module.title}</div>
                              {module.isFree && (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                  Free
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Position: {module.position}
                            </div>
                            <div className="text-xs text-gray-500">
                              Start: {formatDate(module.startTime)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
          </>
        ))}
        {sessions.length === 0 && (
          <TableRow>
            <TableCell colSpan={10} className="text-center py-8">
              No sessions found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
