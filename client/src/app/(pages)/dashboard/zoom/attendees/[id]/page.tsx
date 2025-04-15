"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Send } from "lucide-react";

interface User {
  userId: string;
  name: string;
  email: string;
  subscriptionStatus: string;
  nextPaymentDue?: string;
}

interface ZoomSession {
  id: string;
  title: string;
}

export default function SessionAttendeesPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [attendees, setAttendees] = useState<User[]>([]);
  const [session, setSession] = useState<ZoomSession | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendees();
  }, [sessionId]);

  const fetchAttendees = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom/admin/session/${sessionId}/attendees`,
        { withCredentials: true }
      );
      setAttendees(response.data.data.attendees);
      setSession(response.data.data.zoomSession);
    } catch (error) {
      console.error("Error fetching attendees:", error);
      toast({
        title: "Error",
        description: "Failed to load attendees data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReminders = async () => {
    setIsSending(true);
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
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/zoom")}
          className="p-0 h-auto"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Live Classes
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Session Attendees
          {session && (
            <span className="text-lg font-normal ml-2 text-gray-500">
              ({session.title})
            </span>
          )}
        </h1>
        <Button
          onClick={handleSendReminders}
          disabled={isSending || attendees.length === 0}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {isSending ? "Sending..." : "Send Reminders"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendees List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[70vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendees.length > 0 ? (
                  attendees.map((attendee) => (
                    <TableRow key={attendee.userId}>
                      <TableCell className="font-medium">
                        {attendee.name}
                      </TableCell>
                      <TableCell>{attendee.email}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            attendee.subscriptionStatus === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {attendee.subscriptionStatus}
                        </span>
                      </TableCell>
                      <TableCell>
                        {attendee.nextPaymentDue
                          ? new Date(
                              attendee.nextPaymentDue
                            ).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      No attendees found for this session
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
