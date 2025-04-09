"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { format, isWithinInterval, parseISO } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CalendarIcon,
  Download,
  TrendingUp,
  Users,
  CreditCard,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { useAuth } from "@/helper/AuthContext";
import { cn } from "@/lib/utils";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { Badge } from "@/components/ui/badge";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Purchase {
  id: string;
  courseId: string;
  userId: string;
  createdAt: string;
  purchasePrice: number;
  discountPrice?: number;
  couponCode?: string;
  savingsAmount?: number;
  course: {
    title: string;
    price: number;
    salePrice?: number;
  };
  user?: {
    name: string;
    email: string;
  };
}

interface CourseCount {
  [key: string]: number;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const formatDate = (date: string) => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Intl.DateTimeFormat("en-IN", options).format(new Date(date));
};

const formatIndianPrice = (price?: number) => {
  if (!price && price !== 0) return "₹0";
  return price.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

export default function Purchase() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "recent" | "analytics">(
    "all"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "price">("date");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const { isAuthenticated } = useAuth();

  const uniqueCourses = Array.from(
    new Set(purchases.map((p) => p.course.title))
  ).sort();

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/purchase/all`,
          {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        setPurchases(
          Array.isArray(data?.data?.purchases) ? data.data.purchases : []
        );
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to fetch purchases");
        setPurchases([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) fetchPurchases();
  }, [isAuthenticated]);


  const courseCounts = purchases.reduce((acc, purchase) => {
    const courseTitle = purchase.course.title;
    acc[courseTitle] = (acc[courseTitle] || 0) + 1;
    return acc;
  }, {} as CourseCount);

  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      purchase.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCourse =
      selectedCourse === "all" || purchase.course.title === selectedCourse;

    const matchesDateRange =
      !dateRange.from ||
      !dateRange.to ||
      isWithinInterval(parseISO(purchase.createdAt), {
        start: dateRange.from,
        end: dateRange.to,
      });

    return matchesSearch && matchesCourse && matchesDateRange;
  });

  const sortedPurchases = [...filteredPurchases].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return b.course.price - a.course.price;
  });

  const displayPurchases =
    activeTab === "recent" ? sortedPurchases.slice(0, 5) : sortedPurchases;

  const totalAmount = filteredPurchases.reduce(
    (sum, purchase) => sum + purchase.purchasePrice,
    0
  );



  const downloadCSV = () => {
    const formatCSVPrice = (price: number) => {
      return price.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: false
      });
    };

    const escapeCSV = (field: string | number): string => {
      const stringField = String(field);
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };

    const headers = [
      "Course",
      "User",
      "Purchase Price ($)",
      "Original Price ($)",
      "Savings ($)",
      "Coupon Code",
      "Purchase Date",
      "Status",
    ];

    const csvContent = [
      headers.join(","),
      ...sortedPurchases.map((purchase) =>
        [
          escapeCSV(purchase.course.title),
          escapeCSV(purchase.user?.email || "N/A"),
          formatCSVPrice(purchase.purchasePrice),
          formatCSVPrice(purchase.course.price),
          formatCSVPrice(purchase.savingsAmount || 0),
          escapeCSV(purchase.couponCode || "N/A"),
          escapeCSV(formatDate(purchase.createdAt)),
          "Completed"
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `purchases-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Sales Overview</h1>
        <p className="text-muted-foreground">
          Monitor your course sales and revenue metrics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="text-2xl font-bold">
                {formatIndianPrice(totalAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                From {purchases.length} sales
              </p>
            </div>
            <div className="absolute bottom-0 right-0 p-4">
              <TrendingUp className="h-16 w-16 text-primary/10" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="text-2xl font-bold">
                {formatIndianPrice(totalAmount / (purchases.length || 1))}
              </div>
              <p className="text-xs text-muted-foreground">
                Per transaction
              </p>
            </div>
            <div className="absolute bottom-0 right-0 p-4">
              <Users className="h-16 w-16 text-primary/10" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="text-2xl font-bold">{purchases.length}</div>
              <p className="text-xs text-muted-foreground">
                Enrolled students
              </p>
            </div>
            <div className="absolute bottom-0 right-0 p-4">
              <Users className="h-16 w-16 text-primary/10" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-8 w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Date Range</h4>
                  <Calendar
                    mode="range"
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to,
                    }}
                    onSelect={(range) => setDateRange({
                      from: range?.from,
                      to: range?.to,
                    })}
                    className="rounded-md border"
                  />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Course</h4>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {uniqueCourses.map((course) => (
                        <SelectItem key={course} value={course}>
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Button onClick={downloadCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>

              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Coupon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{purchase.course.title}</span>
                        <span className="text-xs text-muted-foreground">
                          ID: {purchase.id.slice(0, 8)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{purchase.user?.name || "N/A"}</span>
                        <span className="text-xs text-muted-foreground">
                          {purchase.user?.email || "N/A"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-green-600">
                          {formatIndianPrice(purchase.purchasePrice)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Original: {formatIndianPrice(purchase.course.price)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {purchase.couponCode ? (
                        <div className="flex flex-col gap-1.5">
                          <Badge
                            variant="secondary"
                            className="w-fit bg-blue-100 text-blue-800 hover:bg-blue-100"
                          >
                            {purchase.couponCode}
                          </Badge>
                          {purchase.savingsAmount && purchase.savingsAmount > 0 && (
                            <div className="flex items-center gap-1 text-xs">
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200"
                              >
                                Saved {formatIndianPrice(purchase.savingsAmount)}
                              </Badge>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No coupon applied
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>
                          {format(new Date(purchase.createdAt), "MMM dd, yyyy")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(purchase.createdAt), "hh:mm a")}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Analytics Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <Doughnut
                data={{
                  labels: Object.keys(courseCounts),
                  datasets: [{
                    data: Object.values(courseCounts),
                    backgroundColor: [
                      '#4F46E5',
                      '#7C3AED',
                      '#EC4899',
                      '#8B5CF6',
                      '#6366F1'
                    ],
                    borderWidth: 0
                  }]
                }}
                options={{
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  },
                  cutout: '70%'
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Selling Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(courseCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([course, count], index) => (
                  <div key={course} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {index + 1}
                      </div>
                      <span className="font-medium">{course}</span>
                    </div>
                    <span className="text-muted-foreground">{count} sales</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
