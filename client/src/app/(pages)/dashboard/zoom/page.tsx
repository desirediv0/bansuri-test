"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, RefreshCw, Link2 } from "lucide-react";
import ZoomSessionsTable from "./components/ZoomSessionsTable";
import { useToast } from "@/hooks/use-toast";
import ZoomAnalytics from "./components/ZoomAnalytics";
import ZoomSubscriptionsTable from "./components/ZoomSubscriptionsTable";
import ZoomPaymentsTable from "./components/ZoomPaymentsTable";
import PendingApprovals from "./components/PendingApprovals";
import SessionLinks from "./components/SessionLinks";

type TabValue =
  | "overview"
  | "classes"
  | "subscriptions"
  | "payments"
  | "links"
  | "approvals";

export default function ZoomDashboard() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [isLoading, setIsLoading] = useState(true);
  const [zoomLiveClasses, setZoomLiveClasses] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [activeTab, setActiveTab] = useState<TabValue>(() => {
    // Set default tab or use tab from URL param
    if (
      tabParam &&
      [
        "overview",
        "classes",
        "subscriptions",
        "payments",
        "links",
        "approvals",
      ].includes(tabParam)
    ) {
      return tabParam as TabValue;
    }
    return "overview";
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  // Update active tab when URL param changes
  useEffect(() => {
    if (
      tabParam &&
      [
        "overview",
        "classes",
        "subscriptions",
        "payments",
        "links",
        "approvals",
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam as TabValue);
    }
  }, [tabParam]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch live classes
      const classesResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/classes`,
        { withCredentials: true }
      );

      // Fetch analytics
      const analyticsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/analytics`,
        { withCredentials: true }
      );

      setZoomLiveClasses(classesResponse.data.data);
      setAnalyticsData(analyticsResponse.data.data);
    } catch (error) {
      console.error("Error fetching zoom data:", error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessRenewals = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/process-renewals`,
        {},
        { withCredentials: true }
      );

      toast({
        title: "Success",
        description: `Processed ${response.data.data.processed} subscriptions.`,
      });

      fetchData();
    } catch (error) {
      console.error("Error processing renewals:", error);
      toast({
        title: "Error",
        description: "Failed to process renewals.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="md:text-3xl text-xl font-bold">Live Classes</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/zoom/create">
            <Button className="flex items-center gap-2">
              <Plus size={18} /> Create Live Class
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={fetchData}
            className="flex items-center gap-2"
          >
            <RefreshCw size={18} /> Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleProcessRenewals}
            className="flex items-center gap-2"
          >
            <RefreshCw size={18} /> Process Renewals
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={(value: string) => setActiveTab(value as TabValue)}
      >
        <TabsList className="grid grid-cols-6 w-full max-w-4xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classes">Live Classes</TabsTrigger>
          <TabsTrigger value="links">Class Links</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ZoomAnalytics analyticsData={analyticsData} />
          )}
        </TabsContent>

        <TabsContent value="classes" className="mt-6 space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ZoomSessionsTable
              classes={zoomLiveClasses}
              refreshData={fetchData}
            />
          )}
        </TabsContent>

        <TabsContent value="links" className="mt-6 space-y-6">
          <div className="rounded-md border shadow-sm bg-white p-6 overflow-x-auto">
            <SessionLinks sessions={zoomLiveClasses} refreshData={fetchData} />
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-6 space-y-6">
          <ZoomSubscriptionsTable />
        </TabsContent>

        <TabsContent value="payments" className="mt-6 space-y-6">
          <ZoomPaymentsTable />
        </TabsContent>

        <TabsContent value="approvals" className="mt-6 space-y-6">
          <PendingApprovals />
        </TabsContent>
      </Tabs>
    </div>
  );
}
