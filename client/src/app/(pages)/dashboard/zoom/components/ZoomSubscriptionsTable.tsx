"use client";

import { useState, useEffect } from "react";
import axios from "axios";
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
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  name: string;
  email: string;
}

interface ZoomSession {
  title: string;
}

interface Subscription {
  id: string;
  user: User;
  zoomSession: ZoomSession;
  startDate: string;
  endDate: string;
  nextPaymentDate: string;
  status: "ACTIVE" | "CANCELLED" | "EXPIRED";
}

export default function ZoomSubscriptionsTable() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/subscriptions`,
        { withCredentials: true }
      );
      setSubscriptions(response.data.data);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast({
        title: "Error",
        description: "Failed to load subscriptions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Session</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Next Payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.length > 0 ? (
            subscriptions.map((subscription) => (
              <TableRow key={subscription.id}>
                <TableCell>
                  {subscription.user.name}
                  <div className="text-xs text-muted-foreground">
                    {subscription.user.email}
                  </div>
                </TableCell>
                <TableCell>
                  {subscription.zoomSession?.title ?? "Unknown Session"}
                </TableCell>
                <TableCell>{formatDate(subscription.startDate)}</TableCell>
                <TableCell>{formatDate(subscription.endDate)}</TableCell>
                <TableCell>
                  {formatDate(subscription.nextPaymentDate)}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      subscription.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : subscription.status === "CANCELLED"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {subscription.status}
                  </span>
                </TableCell>
                <TableCell>
                  {subscription.status === "ACTIVE" && (
                    <Link href={`/dashboard/zoom/cancel/${subscription.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        title="Cancel Subscription"
                      >
                        Cancel
                      </Button>
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                No subscriptions found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
