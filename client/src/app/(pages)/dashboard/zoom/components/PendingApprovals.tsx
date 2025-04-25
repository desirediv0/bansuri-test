"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Check, X, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  name: string;
  email: string;
}

interface ZoomSession {
  id: string;
  title: string;
  currentRange?: string;
  currentOrientation?: string;
  registrationFee: number;
  courseFee: number;
}

interface PendingSubscription {
  id: string;
  user: User;
  zoomSession: ZoomSession;
  status: "PENDING_APPROVAL";
  createdAt: string;
  isRegistered: boolean;
  registrationPaymentId: string | null;
}

export default function PendingApprovals() {
  const [pendingSubscriptions, setPendingSubscriptions] = useState<
    PendingSubscription[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingSubscriptions();
  }, []);

  const fetchPendingSubscriptions = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/pending-approvals`,
        { withCredentials: true }
      );
      setPendingSubscriptions(response.data.data);
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      toast({
        title: "Error",
        description: "Failed to load pending approvals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (subscriptionId: string) => {
    setProcessingId(subscriptionId);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/approve-subscription/${subscriptionId}`,
        {},
        { withCredentials: true }
      );

      // Update local state by removing the approved subscription
      setPendingSubscriptions((current) =>
        current.filter((sub) => sub.id !== subscriptionId)
      );

      toast({
        title: "Success",
        description: "Subscription has been approved.",
      });
    } catch (error) {
      console.error("Error approving subscription:", error);
      toast({
        title: "Error",
        description: "Failed to approve subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (subscriptionId: string) => {
    setProcessingId(subscriptionId);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/reject-subscription/${subscriptionId}`,
        {},
        { withCredentials: true }
      );

      // Update local state by removing the rejected subscription
      setPendingSubscriptions((current) =>
        current.filter((sub) => sub.id !== subscriptionId)
      );

      toast({
        title: "Success",
        description: "Subscription has been rejected.",
      });
    } catch (error) {
      console.error("Error rejecting subscription:", error);
      toast({
        title: "Error",
        description: "Failed to reject subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPendingSubscriptions();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          Pending Approvals
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
              <TableHead>User</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Registration Date</TableHead>
              <TableHead>Class Details</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingSubscriptions.length > 0 ? (
              pendingSubscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    {subscription.user.name}
                    <div className="text-xs text-muted-foreground">
                      {subscription.user.email}
                    </div>
                  </TableCell>
                  <TableCell>{subscription.zoomSession.title}</TableCell>
                  <TableCell>{formatDate(subscription.createdAt)}</TableCell>
                  <TableCell className="text-sm">
                    {subscription.zoomSession.currentRange && (
                      <div className="text-xs mb-1">
                        <span className="font-medium">Raga:</span>{" "}
                        {subscription.zoomSession.currentRange}
                      </div>
                    )}
                    {subscription.zoomSession.currentOrientation && (
                      <div className="text-xs">
                        <span className="font-medium">Orientation:</span>{" "}
                        {subscription.zoomSession.currentOrientation}
                      </div>
                    )}
                    <div className="text-xs mt-1">
                      <span className="font-medium">Registration Fee:</span> ₹
                      {subscription.zoomSession.registrationFee}
                    </div>
                    <div className="text-xs">
                      <span className="font-medium">Course Fee:</span> ₹
                      {subscription.zoomSession.courseFee}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge
                        variant={
                          subscription.registrationPaymentId
                            ? "default"
                            : "destructive"
                        }
                        className="mr-2"
                      >
                        Registration Fee{" "}
                        {subscription.registrationPaymentId ? "✓" : "✗"}
                      </Badge>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {subscription.isRegistered
                          ? "User has completed registration"
                          : "Registration in progress"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(subscription.id)}
                      disabled={!!processingId}
                    >
                      {processingId === subscription.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      <span className="ml-1">Approve</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReject(subscription.id)}
                      disabled={!!processingId}
                    >
                      {processingId === subscription.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      <span className="ml-1">Reject</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No pending approvals
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
