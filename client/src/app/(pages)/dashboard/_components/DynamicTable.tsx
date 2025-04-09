"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  FileText,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/helper/AuthContext";
import { truncateDescription } from "./TruncateDescription";
import { formatPrice } from "@/helper/FormatPrice";

interface Column {
  key: string;
  label: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  slug: string;
  paid: boolean;
  isPublished: boolean;
  [key: string]: string | number | boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  [key: string]: string | number | boolean;
}

interface TableProps {
  columns: Column[];
  apiUrl: string;
  editUrl?: string;
  editChapter?: string;
  hideCourse?: boolean;
  hideChapter?: boolean;
}

export function DynamicTable({
  columns,
  apiUrl,
  hideCourse,
  hideChapter,
}: TableProps) {
  const [data, setData] = useState<(Course | User)[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const router = useRouter();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      const isAuth = await checkAuth();
      if (!isAuth) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}${apiUrl}?page=${currentPage}`
        );

        const responseData =
          response.data.data?.users ||
          response.data.message?.courses ||
          response.data.data?.courses ||
          [];

        const totalPagesData =
          response.data.message?.totalPages ||
          response.data.data?.totalPages ||
          1;

        const totalItemsData =
          response.data.message?.totalCourses ||
          response.data.data?.totalCourses ||
          responseData.length;

        setData(responseData);
        setTotalPages(totalPagesData);
        setTotalItems(totalItemsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiUrl, checkAuth, currentPage]);

  const handleNavigation = (type: string, slug: string) => {
    switch (type) {
      case "course":
        router.push(`/dashboard/${slug}`);
        break;
      case "section":
        router.push(`/dashboard/section/${slug}`);
        break;
      case "user":
        router.push(`/dashboard/users/${slug}`);
        break;
    }
  };

  const renderStatus = (item: Course | User) => {
    if ("paid" in item) {
      return (
        <Badge
          variant="outline"
          className={`${item.paid
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-blue-50 text-blue-700 border-blue-200"
            } px-2 py-1 text-xs font-medium rounded-md`}
        >
          {item.paid ? "Paid" : "Free"}
        </Badge>
      );
    }

    if ("isVerified" in item) {
      return (
        <Badge
          variant="outline"
          className={`${item.isVerified
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-yellow-50 text-yellow-700 border-yellow-200"
            } px-2 py-1 text-xs font-medium rounded-md`}
        >
          {item.isVerified ? "Verified" : "Unverified"}
        </Badge>
      );
    }
  };

  const renderPublishStatus = (item: Course) => {
    if ("isPublished" in item) {
      return (
        <Badge
          variant="outline"
          className={`${item.isPublished
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-yellow-50 text-yellow-700 border-yellow-200"
            } px-2 py-1 text-xs font-medium rounded-md`}
        >
          {item.isPublished ? "Published" : "Draft"}
        </Badge>
      );
    }
  };

  const renderLoadingSkeleton = () => (
    <div className="w-full overflow-hidden rounded-lg shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>
                <Skeleton className="h-4 w-full" />
              </TableHead>
            ))}
            <TableHead>
              <Skeleton className="h-4 w-20" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              {columns.map((column) => (
                <TableCell key={column.key}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
              <TableCell>
                <Skeleton className="h-8 w-20" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderActionMenu = (item: Course | User) => {
    if ("role" in item) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings className="h-4 w-4 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem
              onClick={() => {
                handleNavigation("user", item.slug as string);
              }}
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4 text-gray-600" />
              <span>Edit User</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings className="h-4 w-4 text-gray-600" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          {!hideCourse && (
            <DropdownMenuItem
              onClick={() => handleNavigation("course", (item as Course).slug)}
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4 text-gray-600" />
              <span>Edit Course</span>
            </DropdownMenuItem>
          )}
          {!hideCourse && (
            <DropdownMenuItem
              onClick={() => handleNavigation("section", (item as Course).slug)}
              className="cursor-pointer"
            >
              <FileText className="mr-2 h-4 w-4 text-gray-600" />
              <span>Manage Sections</span>
            </DropdownMenuItem>
          )}
          {!hideChapter && <DropdownMenuSeparator />}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (loading) return renderLoadingSkeleton();

  return (
    <div className="space-y-4 overflow-hidden">
      <div className="rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 ">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className="py-3 px-4 font-semibold text-gray-900"
                >
                  {column.label}
                </TableHead>
              ))}
              <TableHead className="py-3 px-4 font-semibold text-gray-900">
                Status
              </TableHead>
              <TableHead className="py-3 px-4 font-semibold text-gray-900">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="font-inter">
            {data.map((item) => (
              <TableRow
                key={item.id}
                className="hover:bg-gray-50 transition-colors"
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className="py-3 px-4">
                    {column.key === "description" ? (
                      truncateDescription(String(item[column.key] || ""))
                    ) : column.key === "price" ? (
                      <div className="flex flex-col">
                        {(item as Course).salePrice ? (
                          <>
                            <span className="text-[#290b34] font-semibold">
                              {formatPrice(Number((item as Course).salePrice))}
                            </span>
                            <span className="text-gray-500 line-through text-sm">
                              {formatPrice(Number(item[column.key]))}
                            </span>
                          </>
                        ) : (
                          <span className="text-[#601b79] font-semibold">
                            {formatPrice(Number(item[column.key]))}
                          </span>
                        )}
                      </div>
                    ) : column.key === "createdAt" ||
                      column.key === "updatedAt" ? (
                      new Date(item[column.key] as string).toLocaleDateString()
                    ) : typeof item[column.key] === "boolean" ? (
                      item[column.key] ? (
                        "Yes"
                      ) : (
                        "No"
                      )
                    ) : item[column.key] === null ||
                      item[column.key] === undefined ? (
                      "-"
                    ) : (
                      String(item[column.key])
                    )}
                  </TableCell>
                ))}

                <TableCell className="py-3 px-4">
                  <div className="flex flex-wrap gap-2">
                    {"isPublished" in item &&
                      renderPublishStatus(item as Course)}
                    {renderStatus(item)}
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4">
                  {renderActionMenu(item)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalItems > 12 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 px-2">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * 12 + 1} to{" "}
            {Math.min(currentPage * 12, totalItems)} of {totalItems} entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="flex items-center px-2 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="h-8"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
