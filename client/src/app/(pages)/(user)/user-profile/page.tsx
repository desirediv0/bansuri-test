"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@/helper/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import {
  BookOpenIcon,
  PencilIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  CalendarIcon,
  UserIcon,
  AlertCircle,
  Mail,
  GraduationCap,
  Video,
  LayoutDashboard,
} from "lucide-react";

// Types
import type { ApiResponseTh, Enrollment, UserSec, Purchase } from "@/type";
import UserCertificates from "./UserCertificates";
import MyLiveClasses from "./MyLiveClasses";
import EnhancedCourseCard from "../../_components/EnhancedCourseCard";

interface UserSubscription {
  type: "ONLINE" | "OFFLINE";
  startDate: string;
  endDate: string;
  fees: number;
  status: "ACTIVE" | "EXPIRED";
  lastPayment: string;
  progress?: number;
  achievements?: number;
  attendance?: number;
  batchTiming?: string;
  location?: string;
}

interface ExtendedUserSec extends UserSec {
  subscription?: UserSubscription;
  lastActive?: string;
  location?: string;
  totalCourses?: number;
  completedCourses?: number;
  certificatesEarned?: number;
  joinedDate?: string;
}

// Name Editor Component for focused editing
const NameEditor = ({
  initialName,
  onSave,
  onCancel,
}: {
  initialName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (name.trim()) {
      onSave(name.trim());
    } else {
      onCancel();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
  };

  // Create a completely isolated input to prevent focus issues
  return (
    <div className="flex-1 isolate" onClick={(e) => e.stopPropagation()}>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-xs">
          <Input
            ref={inputRef}
            value={name}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="w-full"
            autoComplete="off"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="outline" size="sm">
            Save
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

const LoadingState = () => (
  <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-white via-red-50 to-gray-50 mt-20">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-64 flex-shrink-0">
          <Skeleton className="h-[500px] w-full rounded-lg" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-32 w-full rounded-lg mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
      </div>
    </div>
  </div>
);

const ErrorState = ({ error, retry }: { error: string; retry: () => void }) => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-white via-red-50 to-gray-50">
    <Card className="w-full max-w-md">
      <CardContent className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Oops! Something went wrong
        </h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button
          onClick={retry}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Try Again
        </Button>
      </CardContent>
    </Card>
  </div>
);

const UserProfile = () => {
  const { checkAuth } = useAuth();
  const [user, setUser] = useState<ExtendedUserSec | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) {
          router.push("/auth");
          return;
        }

        const [userResponse, enrollmentsResponse, purchasesResponse] =
          await Promise.all([
            axios.get<ApiResponseTh<{ user: UserSec }>>(
              `${process.env.NEXT_PUBLIC_API_URL}/user/get-user`
            ),
            axios.get<ApiResponseTh<Enrollment[]>>(
              `${process.env.NEXT_PUBLIC_API_URL}/enrollment/user`
            ),
            axios.get<ApiResponseTh<Purchase[]>>(
              `${process.env.NEXT_PUBLIC_API_URL}/purchase/my-course`
            ),
          ]);

        if (userResponse.data && userResponse.data.success) {
          setUser(userResponse.data.data.user);
        }

        if (enrollmentsResponse.data && enrollmentsResponse.data.success) {
          setEnrollments(enrollmentsResponse.data.data);
        }

        if (purchasesResponse.data && purchasesResponse.data.success) {
          setPurchases(
            Array.isArray(purchasesResponse.data.message)
              ? purchasesResponse.data.message
              : []
          );
        }
      } catch (error) {
        setError("An error occurred while fetching data");
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [checkAuth, router]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} retry={() => router.refresh()} />;
  if (!user) return null;

  // Dashboard content components
  const UserInfo = () => {
    const handleEditStart = () => {
      if (isUpdating) return;
      setIsEditing(true);
    };

    const handleSaveName = async (name: string) => {
      if (isUpdating) return;

      if (!name.trim() || name === user?.name) {
        setIsEditing(false);
        return;
      }

      setIsEditing(false);

      try {
        setIsUpdating(true);

        const response = await axios.patch(
          `${process.env.NEXT_PUBLIC_API_URL}/user/update-name`,
          { name },
          { withCredentials: true }
        );

        if (response.data && response.data.success) {
          setUser((prevUser) => (prevUser ? { ...prevUser, name } : null));
          toast.success("Name updated successfully");
        } else {
          throw new Error(response.data.message || "Failed to update name");
        }
      } catch (error: any) {
        console.error("Error updating name:", error);
        toast.error(error.response?.data?.message || "Failed to update name");
      } finally {
        setIsUpdating(false);
      }
    };

    const handleCancelEdit = () => {
      setIsEditing(false);
    };

    return (
      <Card className="border-red-100 mb-6 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-2xl font-bold">
                {user?.name.charAt(0)}
              </div>
              {user?.isVerified && (
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1">
                  <ShieldCheckIcon className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <NameEditor
                    initialName={user?.name || ""}
                    onSave={handleSaveName}
                    onCancel={handleCancelEdit}
                  />
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {user?.name}
                    </h1>
                    <Button variant="ghost" size="sm" onClick={handleEditStart}>
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4 text-red-500" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <UserIcon className="h-4 w-4 text-red-500" />
                  <Badge
                    variant="outline"
                    className="text-sm font-medium bg-red-50"
                  >
                    {user?.role}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <CalendarIcon className="h-4 w-4 text-red-500" />
                  <span>
                    Joined{" "}
                    {format(
                      new Date(user?.joinedDate || Date.now()),
                      "MMMM yyyy"
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EnrolledCoursesContent = () => (
    <section>
      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
        <BookOpenIcon className="h-5 w-5 text-red-600" />
        My Enrolled Courses
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrollments.length === 0 ? (
          <Card className="col-span-full p-8 text-center border-dashed border-2 border-red-200">
            <p className="text-gray-600 mb-4">
              You haven't enrolled in any courses yet.
            </p>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => router.push("/courses")}
            >
              Browse Courses
            </Button>
          </Card>
        ) : (
          enrollments.map((enrollment: any) => (
            <EnhancedCourseCard
              hidePrice={true}
              key={enrollment.course.id}
              course={enrollment.course}
            />
          ))
        )}
      </div>
    </section>
  );

  const PurchasedCoursesContent = () => (
    <section>
      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
        <ShoppingCartIcon className="h-5 w-5 text-red-600" />
        Purchased Courses
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {purchases.length === 0 ? (
          <Card className="col-span-full p-8 text-center border-dashed border-2 border-red-200">
            <p className="text-gray-600 mb-4">No purchased courses yet.</p>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => router.push("/courses")}
            >
              Explore Courses
            </Button>
          </Card>
        ) : (
          purchases.map((purchase: any) => (
            <EnhancedCourseCard
              hidePrice={true}
              key={purchase.course.id}
              course={purchase.course}
            />
          ))
        )}
      </div>
    </section>
  );

  // Dashboard Stats Component
  const DashboardStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <BookOpenIcon className="h-5 w-5 mr-2 text-red-600" />
            Course Summary
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-gray-600">Enrolled Courses</span>
              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 font-medium"
              >
                {enrollments.length}
              </Badge>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-gray-600">Purchased Courses</span>
              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 font-medium"
              >
                {purchases.length}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Resources</span>
              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 font-medium"
              >
                {enrollments.length + purchases.length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Video className="h-5 w-5 mr-2 text-red-600" />
            Live Sessions
          </h3>
          <p className="text-gray-600 mb-4">
            Access your upcoming live classes and recorded sessions.
          </p>
          <Button
            className="w-full bg-red-600 hover:bg-red-700"
            onClick={() => setActiveTab("live-classes")}
          >
            View Live Classes
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 font-plus-jakarta-sans mt-20 mb-10">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar / Mobile Tabs */}
          <div className="w-full lg:w-72 flex-shrink-0">
            {/* Mobile Tabs */}
            <div className="block lg:hidden mb-6">
              <Tabs
                defaultValue="dashboard"
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="w-full grid grid-cols-4 bg-white shadow-sm rounded-lg p-1">
                  <TabsTrigger
                    value="dashboard"
                    className="data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2 sm:mr-0 lg:mr-2" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="certificates"
                    className="data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
                  >
                    <GraduationCap className="h-4 w-4 mr-2 sm:mr-0 lg:mr-2" />
                    <span className="hidden sm:inline">Certificates</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="live-classes"
                    className="data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
                  >
                    <Video className="h-4 w-4 mr-2 sm:mr-0 lg:mr-2" />
                    <span className="hidden sm:inline">Live Classes</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="my-courses"
                    className="data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
                  >
                    <BookOpenIcon className="h-4 w-4 mr-2 sm:mr-0 lg:mr-2" />
                    <span className="hidden sm:inline">My Courses</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Desktop Sidebar */}
            <Card className="hidden lg:block sticky top-24 border-red-100 shadow-sm overflow-hidden">
              <div className="p-4 bg-red-50">
                <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-red-600" />
                  My Dashboard
                </h2>
              </div>
              <div className="p-3 space-y-1">
                <Button
                  variant={activeTab === "dashboard" ? "default" : "ghost"}
                  className={`w-full justify-start font-medium ${
                    activeTab === "dashboard"
                      ? "bg-red-600 hover:bg-red-700"
                      : "hover:bg-red-50 hover:text-red-600"
                  }`}
                  onClick={() => setActiveTab("dashboard")}
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant={activeTab === "certificates" ? "default" : "ghost"}
                  className={`w-full justify-start font-medium ${
                    activeTab === "certificates"
                      ? "bg-red-600 hover:bg-red-700"
                      : "hover:bg-red-50 hover:text-red-600"
                  }`}
                  onClick={() => setActiveTab("certificates")}
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Certificates
                </Button>
                <Button
                  variant={activeTab === "live-classes" ? "default" : "ghost"}
                  className={`w-full justify-start font-medium ${
                    activeTab === "live-classes"
                      ? "bg-red-600 hover:bg-red-700"
                      : "hover:bg-red-50 hover:text-red-600"
                  }`}
                  onClick={() => setActiveTab("live-classes")}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Live Classes
                </Button>
                <Button
                  variant={
                    activeTab === "enrolled-courses" ? "default" : "ghost"
                  }
                  className={`w-full justify-start font-medium ${
                    activeTab === "enrolled-courses"
                      ? "bg-red-600 hover:bg-red-700"
                      : "hover:bg-red-50 hover:text-red-600"
                  }`}
                  onClick={() => setActiveTab("enrolled-courses")}
                >
                  <BookOpenIcon className="h-4 w-4 mr-2" />
                  Enrolled Courses
                </Button>
                <Button
                  variant={
                    activeTab === "purchased-courses" ? "default" : "ghost"
                  }
                  className={`w-full justify-start font-medium ${
                    activeTab === "purchased-courses"
                      ? "bg-red-600 hover:bg-red-700"
                      : "hover:bg-red-50 hover:text-red-600"
                  }`}
                  onClick={() => setActiveTab("purchased-courses")}
                >
                  <ShoppingCartIcon className="h-4 w-4 mr-2" />
                  Purchased Courses
                </Button>
              </div>
            </Card>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {/* Mobile Tabs Content */}
            <div className="block lg:hidden">
              <Tabs value={activeTab} className="w-full">
                <TabsContent value="dashboard" className="mt-0">
                  <UserInfo />
                  <DashboardStats />
                  <UserCertificates />
                </TabsContent>
                <TabsContent value="certificates" className="mt-0">
                  <UserInfo />
                  <UserCertificates />
                </TabsContent>
                <TabsContent value="live-classes" className="mt-0">
                  <UserInfo />
                  <MyLiveClasses />
                </TabsContent>
                <TabsContent value="my-courses" className="mt-0">
                  <UserInfo />
                  <div className="space-y-8">
                    <EnrolledCoursesContent />
                    <PurchasedCoursesContent />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Desktop Content */}
            <div className="hidden lg:block">
              <UserInfo />

              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  <DashboardStats />
                  <UserCertificates />
                </div>
              )}

              {activeTab === "certificates" && <UserCertificates />}
              {activeTab === "live-classes" && <MyLiveClasses />}
              {activeTab === "enrolled-courses" && <EnrolledCoursesContent />}
              {activeTab === "purchased-courses" && <PurchasedCoursesContent />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
