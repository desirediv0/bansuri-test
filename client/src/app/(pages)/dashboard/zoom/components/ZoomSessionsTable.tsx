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
import { Send, Edit, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Type definitions
interface User {
  id: string;
  name: string;
  email: string;
}

interface ZoomSession {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  price: number;
  isActive: boolean;
  thumbnailUrl?: string | null;
  subscribedUsers?: User[];
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Thumbnail</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Start Time</TableHead>
          <TableHead>End Time</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Subscribers</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => (
          <TableRow key={session.id}>
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
            <TableCell>{session.title}</TableCell>
            <TableCell>{formatDate(session.startTime)}</TableCell>
            <TableCell>{formatDate(session.endTime)}</TableCell>
            <TableCell>₹{session.price}</TableCell>
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
        ))}
        {sessions.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8">
              No sessions found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
