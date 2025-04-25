"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";

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

export default function CancelSubscriptionPage() {
  const router = useRouter();
  const params = useParams();
  const subscriptionId = params.id as string;

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        // Since we don't have a direct endpoint to get a subscription by ID,
        // we'll fetch all subscriptions and find the one we need
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/subscriptions`,
          { withCredentials: true }
        );

        const allSubscriptions = response.data.data;
        const targetSubscription = allSubscriptions.find(
          (sub: any) => sub.id === subscriptionId
        );

        if (targetSubscription) {
          setSubscription(targetSubscription);
        } else {
          throw new Error("Subscription not found");
        }
      } catch (error) {
        console.error("Error fetching subscription details:", error);
        toast({
          title: "Error",
          description: "Failed to load subscription details. Please try again.",
          variant: "destructive",
        });
        router.push("/dashboard/zoom?tab=subscriptions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [subscriptionId, toast, router]);

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    setIsCancelling(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/cancel-subscription/${subscription.id}`,
        {},
        { withCredentials: true }
      );

      toast({
        title: "Success",
        description: "Subscription cancelled successfully",
      });

      router.push("/dashboard/zoom?tab=subscriptions");
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive",
      });
      setIsCancelling(false);
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

  if (!subscription) {
    return (
      <div className="container mx-auto py-6">
        <p>Subscription not found</p>
        <Button
          onClick={() => router.push("/dashboard/zoom?tab=subscriptions")}
        >
          Back to Live Classes
        </Button>
      </div>
    );
  }

  if (subscription.status !== "ACTIVE") {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/zoom?tab=subscriptions")}
            className="p-0 h-auto"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Live Classes
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Already Cancelled</CardTitle>
            <CardDescription>
              This subscription is not active and cannot be cancelled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/dashboard/zoom?tab=subscriptions")}
              className="w-full"
            >
              Return to Live Classes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/zoom?tab=subscriptions")}
          className="p-0 h-auto"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Live Classes
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cancel Subscription</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Confirm Cancellation
          </CardTitle>
          <CardDescription>
            Are you sure you want to cancel this subscription? This action
            cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md space-y-3">
            <div>
              <p className="font-medium text-gray-500">User</p>
              <p className="font-bold">{subscription.user.name}</p>
              <p className="text-sm text-gray-500">{subscription.user.email}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Session</p>
              <p className="font-bold">{subscription.zoomSession.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-gray-500">Start Date</p>
                <p>{formatDate(subscription.startDate)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500">Next Payment</p>
                <p>{formatDate(subscription.nextPaymentDate)}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/zoom?tab=subscriptions")}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="flex items-center gap-2"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Subscription"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
