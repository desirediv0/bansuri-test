"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import ZoomSessionsTable from "./components/ZoomSessionsTable";
import { useToast } from "@/hooks/use-toast";
import ZoomAnalytics from "./components/ZoomAnalytics";
import ZoomSubscriptionsTable from "./components/ZoomSubscriptionsTable";
import ZoomPaymentsTable from "./components/ZoomPaymentsTable";
import CreateZoomSessionForm from "./components/CreateZoomSessionForm";

export default function ZoomDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [zoomSessions, setZoomSessions] = useState([]);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch sessions
            const sessionsResponse = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/zoom/admin/sessions`,
                { withCredentials: true }
            );

            // Fetch analytics
            const analyticsResponse = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/zoom/admin/analytics`,
                { withCredentials: true }
            );

            setZoomSessions(sessionsResponse.data.data);
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
                `${process.env.NEXT_PUBLIC_API_URL}/zoom/admin/process-renewals`,
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
                <h1 className="md:text-3xl text-xl font-bold">Zoom Classes Dashboard</h1>
                <div className="flex gap-2">
                    <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
                        <Plus size={18} /> Create Session
                    </Button>
                    <Button variant="outline" onClick={fetchData} className="flex items-center gap-2">
                        <RefreshCw size={18} /> Refresh
                    </Button>
                    <Button variant="outline" onClick={handleProcessRenewals} className="flex items-center gap-2">
                        <RefreshCw size={18} /> Process Renewals
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 w-full max-w-md">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="sessions">Sessions</TabsTrigger>
                    <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
                    <TabsTrigger value="payments">Payments</TabsTrigger>
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

                <TabsContent value="sessions" className="mt-6 space-y-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <ZoomSessionsTable
                            sessions={zoomSessions}
                            refreshData={fetchData}
                        />
                    )}
                </TabsContent>

                <TabsContent value="subscriptions" className="mt-6 space-y-6">
                    <ZoomSubscriptionsTable />
                </TabsContent>

                <TabsContent value="payments" className="mt-6 space-y-6">
                    <ZoomPaymentsTable />
                </TabsContent>
            </Tabs>

            {showCreateForm && (
                <CreateZoomSessionForm
                    onClose={() => setShowCreateForm(false)}
                    onSuccess={() => {
                        setShowCreateForm(false);
                        fetchData();
                        setActiveTab("sessions");
                    }}
                />
            )}
        </div>
    );
}
