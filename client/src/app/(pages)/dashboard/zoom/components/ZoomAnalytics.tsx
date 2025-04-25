"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, IndianRupee } from "lucide-react";

// Define types for the analytics data
interface User {
  id: string;
  name: string;
  email: string;
}

interface ZoomSession {
  id: string;
  title: string;
  isActive: boolean;
}

interface SessionPopularity extends ZoomSession {
  subscriberCount: number;
}

interface Payment {
  id: string;
  amount: number;
  createdAt: string;
  user: User;
  subscription: {
    zoomSession: {
      title: string;
    };
  };
}

interface MonthlyRevenue {
  [month: string]: number;
}

interface AnalyticsData {
  totalSessions: number;
  activeSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: MonthlyRevenue;
  sessionPopularity: SessionPopularity[];
  recentPayments: Payment[];
}

interface ZoomAnalyticsProps {
  analyticsData: AnalyticsData | null;
}

export default function ZoomAnalytics({ analyticsData }: ZoomAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<string>("summary");

  if (!analyticsData) {
    return <div>No analytics data available</div>;
  }

  // Convert monthly revenue object to array for display
  const monthlyRevenueData = Object.entries(
    analyticsData.monthlyRevenue || {}
  ).map(([month, amount]) => ({ month, amount }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sessions
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.totalSessions}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Subscriptions
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.activeSubscriptions}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{analyticsData.totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs
        defaultValue="summary"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="popular">Popular Sessions</TabsTrigger>
          <TabsTrigger value="recent">Recent Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zoom Classes Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium">Sessions</h3>
                    <p className="text-3xl font-bold">
                      {analyticsData.totalSessions}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Subscribers</h3>
                    <p className="text-3xl font-bold">
                      {analyticsData.activeSubscriptions}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Total Revenue</h3>
                  <p className="text-3xl font-bold">
                    ₹{analyticsData.totalRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyRevenueData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Revenue (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyRevenueData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.month}</TableCell>
                        <TableCell className="text-right">
                          {item.amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-4">No revenue data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Popular Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.sessionPopularity &&
              analyticsData.sessionPopularity.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session</TableHead>
                      <TableHead className="text-center">Subscribers</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData.sessionPopularity.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>{session.title}</TableCell>
                        <TableCell className="text-center">
                          {session.subscriberCount}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              session.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {session.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-4">No session data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.recentPayments &&
              analyticsData.recentPayments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData.recentPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {payment.user.name}
                          <div className="text-xs text-muted-foreground">
                            {payment.user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {payment.subscription?.zoomSession?.title ??
                            "Unknown Session"}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{payment.amount}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-4">No recent payments</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
