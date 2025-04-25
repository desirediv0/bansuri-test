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
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  name: string;
  email: string;
}

interface ZoomSession {
  title: string;
}

interface Subscription {
  zoomSession: ZoomSession;
}

interface Payment {
  id: string;
  receiptNumber: string;
  user: User;
  subscription: Subscription;
  amount: number;
  razorpay_payment_id: string;
  createdAt: string;
  status: "COMPLETED" | "FAILED";
}

interface Pagination {
  page: number;
  pages: number;
  total: number;
}

export default function ZoomPaymentsTable() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pages: 1,
    total: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments(1);
  }, []);

  const fetchPayments = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/payments?page=${page}&limit=10`,
        { withCredentials: true }
      );
      setPayments(response.data.data.payments);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast({
        title: "Error",
        description: "Failed to load payment data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt #</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length > 0 ? (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.receiptNumber}</TableCell>
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
                  <TableCell>₹{payment.amount}</TableCell>
                  <TableCell>
                    <span className="text-xs">
                      {payment.razorpay_payment_id}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(payment.createdAt)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        payment.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No payment records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {payments.length > 0 && (
        <div className="flex items-center justify-end space-x-2">
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages} ({pagination.total}{" "}
            items)
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPayments(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPayments(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
