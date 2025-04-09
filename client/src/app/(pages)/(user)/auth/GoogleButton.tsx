"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useState } from "react";

interface GoogleButtonProps {
  mode: "login" | "register";
  courseSlug?: string;
}

export default function GoogleButton({ mode, courseSlug }: GoogleButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/user/google-auth`,
          {
            token: tokenResponse.access_token,
          },
          {
            withCredentials: true,
          }
        );

        if (response.data.success) {
          const { accessToken, user } = response.data.data;
          Cookies.set("accessToken", accessToken, {
            expires: 7,
            secure: true,
            sameSite: "lax",
          });
          toast.success("Google authentication successful!");

          if (user.role === "ADMIN") {
            router.push("/dashboard");
            return;
          }
          if (courseSlug) {
            try {
              await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/cart/add/${courseSlug}`
              );
              router.push(`/buy?course-slug=${courseSlug}`);
            } catch (error) {
              if (axios.isAxiosError(error)) {
                router.push(`/courses/${courseSlug}`);
              }
            }
          } else {
            router.push("/user-profile");
          }
        }
      } catch (error) {
        console.error("Google Auth Error:", error);
        if (axios.isAxiosError(error) && error.response?.data?.message) {
          toast.error(error.response.data.message, {
            duration: 5000,
          });
        } else {
          toast.error("Authentication failed");
        }
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      toast.error("Google authentication failed");
      setIsLoading(false);
    },
    flow: "implicit",
  });

  return (
    <Button
      type="button"
      onClick={() => googleLogin()}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 mt-4 transition-all duration-200 disabled:opacity-50"
    >
      <Image src={"/google.png"} alt="Google" width={20} height={20} />
      <span>
        {isLoading
          ? "Please wait..."
          : mode === "login"
            ? "Sign in with Google"
            : "Sign up with Google"}
      </span>
    </Button>
  );
}
