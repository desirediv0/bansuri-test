"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import axios, { AxiosError } from "axios";
import Cookies from "js-cookie";

function VerifyEmailContent() {
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<"success" | "error" | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const verificationRef = useRef(false);

  const verifyEmail = useCallback(async () => {
    // Skip if already verified or verifying
    if (verificationRef.current || isVerifying) return;

    const token = searchParams.get("token");
    const id = searchParams.get("id");

    if (!token || !id) {
      setLoading(false);
      setVerificationStatus("error");
      toast.error("Invalid verification link");
      return;
    }

    try {
      setIsVerifying(true);
      verificationRef.current = true;

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/user/verify-email`,
        { token, id },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Set cookies in frontend
        const { accessToken } = response.data.data;
        Cookies.set("accessToken", accessToken, { expires: 7 });

        setVerificationStatus("success");
        toast.success("Email verified and logged in successfully!");

        const userRole = response.data.data.user.role;
        const redirectPath = userRole === "ADMIN" ? "/dashboard" : "/user-profile";

        setTimeout(() => {
          router.push(redirectPath);
        }, 1300);
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      setVerificationStatus("error");
      toast.error(
        axiosError.response?.data?.message ||
        "An error occurred during email verification"
      );
    } finally {
      setLoading(false);
      setIsVerifying(false);
    }
  }, [searchParams, router, isVerifying]);

  useEffect(() => {
    let mounted = true;

    if (mounted && !verificationRef.current) {
      verifyEmail();
    }

    return () => {
      mounted = false;
    };
  }, [verifyEmail]);




  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white p-4">
      <Card className="w-full max-w-md border border-red-100 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader className="space-y-2 text-center pb-6 border-b border-red-100">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Email Verification
          </CardTitle>
          <CardDescription className="text-gray-600 text-base">
            {loading
              ? "Verifying your email address..."
              : verificationStatus === "success"
                ? "Great! Your verification is complete"
                : "Oops! Verification encountered an issue"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-6 pt-6">
          {loading ? (
            <Loader2 className="h-12 w-12 animate-spin text-red-600" />
          ) : verificationStatus === "success" ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <p className="text-green-600 font-medium text-lg">
                Your email has been verified successfully!
              </p>
              <p className="text-gray-500">
                Redirecting you to login page...
              </p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <p className="text-red-600 font-medium text-lg">
                Email verification failed
              </p>
              <Button
                onClick={() => router.push("/auth")}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-8 py-2 rounded-lg transition-all duration-200 hover:shadow-lg"
              >
                Go to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white">
        <Loader2 className="h-12 w-12 animate-spin text-red-600" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}