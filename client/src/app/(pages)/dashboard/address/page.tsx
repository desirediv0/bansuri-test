"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/helper/AuthContext";
import { AddressData } from "@/type";

const Address = () => {
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all");
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated]);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/billing/get-all-billing-details`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        const addressData = response.data.data || [];
        if (Array.isArray(addressData)) {
          setAddresses(addressData);
        } else {
          setAddresses([]);
          console.error("Response data is not an array:", addressData);
        }
      }
    } catch {
      setError("Failed to fetch addresses");
      toast.error("Error loading addresses");
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/billing/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setAddresses(addresses.filter((address) => address.id !== id));
      toast.success("Address deleted successfully");
    } catch {
      toast.error("Failed to delete address");
    }
  };

  const filteredAddresses = addresses.filter((address) => {
    if (filter === "paid") return address.paymentStatus;
    if (filter === "unpaid") return !address.paymentStatus;
    return true;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Users Addresses</h1>
        <Select
          value={filter}
          onValueChange={(value: "all" | "paid" | "unpaid") => setFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Addresses</SelectItem>
            <SelectItem value="paid">Paid Only</SelectItem>
            <SelectItem value="unpaid">Unpaid Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAddresses.map((address) => (
          <Card key={address.id} className="relative">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{address.fullName}</span>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(address.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{address.email}</p>
                <p className="text-sm">{address.address}</p>
                <p className="text-sm">
                  {address.city}, {address.state}
                </p>
                <p className="text-sm">
                  {address.country} - {address.zipCode}
                </p>
                <div className="mt-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      address.paymentStatus
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {address.paymentStatus ? "Paid" : "Unpaid"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAddresses.length === 0 && (
        <p className="text-center text-gray-500 mt-8">No addresses found</p>
      )}
    </div>
  );
};

export default Address;
