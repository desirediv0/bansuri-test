"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { useForm, SubmitHandler } from "react-hook-form";
import Script from "next/script";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BillingForm from "./BillingForm";
import CouponForm from "./CouponForm";
import { useAuth } from "@/helper/AuthContext";
import {
  AddressData,
  BillingDetails,
  CouponDetails,
  CourseData,
  PaymentVerificationData,
  RazorpayResponse,
  UserData,
} from "@/type";
import CourseCard from "./CourseCard";
import AddressList from "./AddressList";

import { Trash2, XCircle } from "lucide-react";
import { formatPrice } from "@/helper/FormatPrice";
import { CourseParams } from "@/components/CourseParams";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export default function BuyPage() {
  return (
    <Suspense fallback={<BuyPageSkeleton />}>
      <CourseParams>
        {(courseSlugs) => <BuyPageContent courseSlugs={courseSlugs} />}
      </CourseParams>
    </Suspense>
  );
}

function BuyPageContent({ courseSlugs }: { courseSlugs: string[] }) {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [addresses, setAddresses] = useState<AddressData[]>([]);

  const { checkAuth } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BillingDetails>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponDetails | null>(
    null
  );

  useEffect(() => {
    fetchData(courseSlugs);
  }, []);

  const fetchData = async (slugs: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) {
        router.push("/auth");
        return;
      }

      // Fetch course data
      const courseDataPromises = slugs.map((slug) =>
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/course/get-course-page/${slug}`
        )
      );
      const courseResponses = await Promise.all(courseDataPromises);
      const fetchedCourses = courseResponses.map(
        (response) => response.data.data
      );
      setCourses(fetchedCourses);

      // Fetch user data
      const userResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/user/get-user`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setUser(userResponse.data.user);

      // Fetch saved addresses
      const addressResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/billing/addresses`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setAddresses(addressResponse.data.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Unauthorized access - Invalid token");
        router.push("/auth");
      } else {
        setError("An error occurred while fetching data");
        console.error("Fetch error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCouponApplied = (
    discountedPrice: number,
    couponDetails: CouponDetails
  ) => {
    setDiscountedPrice(discountedPrice);
    setAppliedCoupon(couponDetails);
  };

  const removeCoupon = () => {
    setDiscountedPrice(null);
    setAppliedCoupon(null);
  };

  const handleAddressSelect = (address: AddressData) => {
    setValue("fullName", address.fullName);
    setValue("email", address.email);
    setValue("address", address.address);
    setValue("city", address.city);
    setValue("state", address.state);
    setValue("country", address.country);
    setValue("zipCode", address.zipCode);
    toast.success("Address selected");
  };

  const onSubmit: SubmitHandler<BillingDetails> = async (data) => {
    setIsSubmitting(true);
    try {
      // Save billing details first
      const billingResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/billing`,
        {
          ...data,
          courseIds: courses.map((course) => course.id),
          saveAddress: data.saveAddress,
        }
      );

      if (!billingResponse.data.success) {
        throw new Error("Failed to save billing details");
      }

      // Get Razorpay Key
      const keyResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/payment/getkey`
      );
      const key = keyResponse.data.key;

      // Create Razorpay order
      const amountUSDupees =
        discountedPrice ||
        courses.reduce(
          (total, course) => total + (course.salePrice || course.price),
          0
        );
      // const amountInPaise = Math.round(amountUSDupees * 100);
      const amountInPaise = Math.round(amountUSDupees * 100);
      const orderResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/payment/checkout`,
        { amount: amountInPaise }
      );
      const order = orderResponse.data.data;

      const options = {
        key: key,
        amount: order.amount,
        currency: "INR",
        name: "Bansuri Vidya Mandir | Indian Classical Music Institute",
        description: "Join Bansuri Vidya Mandir - A premier institute dedicated to teaching Indian classical flute (bansuri), traditional music education, and cultural arts. Experience authentic guru-shishya parampara with expert mentorship.",
        order_id: order.id,
        image: "/logo-black.png",
        handler: async function (response: RazorpayResponse) {
          try {
            const courseDetails = courses.map((course) => {
              const basePrice = course.salePrice || course.price;
              let finalPrice = basePrice;

              if (appliedCoupon && discountedPrice) {
                const discountRatio = discountedPrice / currentTotalPrice;
                finalPrice = basePrice * discountRatio;
              }

              return {
                id: course.id,
                price: basePrice,
                discountedPrice: finalPrice !== basePrice ? finalPrice : null,
              };
            });
            const verificationData: PaymentVerificationData = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              courseIds: courses.map((course) => course.id),
              billingId: billingResponse.data.data.id,
              couponDetails: appliedCoupon,
              courseDetails,
            };

            const res = await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/payment/payment-verification`,
              verificationData
            );

            if (res.data.success) {
              toast.success("Payment successful!");
              router.push("/user-profile");
            } else {
              throw new Error(
                res.data.message || "Payment verification failed"
              );
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            if (axios.isAxiosError(error)) {
              toast.error(
                error.response?.data?.message || "Payment verification failed"
              );
            } else {
              toast.error("Payment verification failed");
            }
          }
        },
        prefill: {
          name: data.fullName,
          email: data.email,
        },
        theme: {
          color: "#EF4444",
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to initiate checkout");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <BuyPageSkeleton />;
  }

  if (error) {
    return <ErrorCard error={error} retry={() => fetchData(courseSlugs)} />;
  }

  if (!courses.length) {
    return <div>No course data available.</div>;
  }

  const originalTotalPrice = courses.reduce(
    (total, course) => total + course.price,
    0
  );

  const currentTotalPrice = courses.reduce(
    (total, course) => total + (course.salePrice || course.price),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12 px-4 sm:px-6 lg:px-8 font-plus-jakarta-sans mt-16">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-red-100">
          <div className="p-6 md:p-8 lg:p-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Your Cart</h1>
            {user && (
              <div className="mb-8 p-6 bg-red-50 rounded-xl border border-red-200">
                <h2 className="text-2xl font-semibold text-red-800 mb-2">
                  Welcome, {user.name}!
                </h2>
                <p className="text-red-600 text-lg">{user.email}</p>
              </div>
            )}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  Billing Details
                </h2>
                <BillingForm register={register} errors={errors} user={user} />
                <AddressList
                  addresses={addresses}
                  onAddressSelect={handleAddressSelect}
                />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  Order Summary
                </h2>
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-6">
                    <CouponForm
                      onCouponApplied={handleCouponApplied}
                      originalPrice={originalTotalPrice}
                      salePrice={
                        currentTotalPrice < originalTotalPrice
                          ? currentTotalPrice
                          : undefined
                      }
                      courseId={courses.map((course) => course.id)}
                    />

                    <div className="mt-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg text-gray-600">Total:</span>
                        <div className="flex flex-col items-end">
                          <span
                            className={`text-2xl font-bold ${discountedPrice ||
                              currentTotalPrice < originalTotalPrice
                              ? "line-through text-gray-400"
                              : "text-gray-900"
                              }`}
                          >
                            {formatPrice(originalTotalPrice)}
                          </span>
                          {(discountedPrice !== null ||
                            currentTotalPrice < originalTotalPrice) && (
                              <>
                                <span className="text-2xl font-bold text-green-600">
                                  {formatPrice(
                                    discountedPrice || currentTotalPrice
                                  )}
                                </span>
                                <span className="text-sm text-green-600">
                                  You save:{" "}
                                  {formatPrice(
                                    originalTotalPrice -
                                    (discountedPrice || currentTotalPrice)
                                  )}
                                </span>
                              </>
                            )}
                        </div>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                          <span className="text-lg text-gray-600">
                            Applied Coupon:
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                              {appliedCoupon.code}
                            </span>
                            <Button
                              onClick={removeCoupon}
                              variant="destructive"
                              size="sm"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={handleSubmit(onSubmit)}
                      className="w-full mt-8 py-6 text-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Processing..." : "Proceed to Checkout"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BuyPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 md:p-8 lg:p-10">
            <Skeleton className="w-64 h-12 bg-red-200/50 mb-8" />
            <Skeleton className="w-full h-24 bg-red-100/50 mb-8" />
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-full h-64 bg-red-50/50" />
              ))}
            </div>
            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              <div>
                <Skeleton className="w-48 h-8 bg-red-100/50 mb-6" />
                <Skeleton className="w-full h-96 bg-red-50/50" />
              </div>
              <div>
                <Skeleton className="w-48 h-8 bg-red-100/50 mb-6" />
                <Skeleton className="w-full h-96 bg-red-50/50" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function ErrorCard({ error, retry }: { error: string; retry: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-red-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md bg-white shadow-xl border border-red-100">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4 flex items-center gap-2">
            <XCircle className="w-6 h-6" />
            Error Occurred
          </h2>
          <p className="text-gray-700 mb-6 bg-red-50 p-4 rounded-lg border border-red-100">
            {error}
          </p>
          <Button
            onClick={retry}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
