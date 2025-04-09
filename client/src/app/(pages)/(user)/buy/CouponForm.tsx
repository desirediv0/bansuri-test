import React, { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CouponFormProps } from "@/type";

export default function CouponForm({
  onCouponApplied,
  originalPrice,
  salePrice,
  courseId,
}: CouponFormProps) {
  const [couponCode, setCouponCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const applyCoupon = async () => {
    if (!couponCode || !courseId || !originalPrice) {
      toast.error("Missing required fields");
      return;
    }
    const priceToUse = salePrice || originalPrice;

    setIsApplying(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/coupon/apply`,
        {
          code: couponCode,
          originalPrice: Number(priceToUse),
          courseIds: Array.isArray(courseId) ? courseId : [courseId],
        }
      );

      if (response.data?.success) {
        const { discountedPrice, couponDetails } = response.data.data;
        onCouponApplied(discountedPrice, couponDetails);
        toast.success("Coupon applied successfully!");
      } else {
        throw new Error(response.data?.message || "Failed to apply coupon");
      }
    } catch (error: unknown) {
      console.error("Error applying coupon:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data?.message || "Failed to apply coupon");
      } else {
        toast.error("Failed to apply coupon");
      }
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Apply Coupon</h3>
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Enter coupon code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          className="flex-grow"
        />
        <Button
          onClick={applyCoupon}
          disabled={isApplying}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isApplying ? "Applying..." : "Apply"}
        </Button>
      </div>
    </div>
  );
}
