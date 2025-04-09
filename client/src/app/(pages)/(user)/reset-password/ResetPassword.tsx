"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PasswordResetForm } from "@/type";
import axios from "axios";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import PasswordValidation from "@/components/ui/PasswordValidation";

function ResetPasswordContent() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<PasswordResetForm>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });


  const password = form.watch("password");

  const onSubmit = async (data: PasswordResetForm) => {
    setLoading(true);
    const token = searchParams.get("token");
    const id = searchParams.get("id");

    if (!token || !id) {
      toast.error("Invalid reset password link");
      setLoading(false);
      return;
    }

    try {
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/user/reset-password`,
        {
          token,
          id,
          password: data.password,
        }
      );

      if (result.status !== 200) {
        throw new Error(result.data.message || "Password reset failed");
      }

      toast.success("Password reset successfully!", {
        duration: 5000,
        position: "top-center",
      });
      setTimeout(() => router.push("/auth"), 2000);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred during password reset",
        {
          duration: 5000,
          position: "top-center",
        }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = searchParams.get("token");
    const id = searchParams.get("id");

    if (!token || !id) {
      toast.error("Invalid reset password link", {
        duration: 5000,
        position: "top-center",
      });
      router.push("/auth");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/,
                    message: "Password must meet all requirements"
                  }
                })}
              />
              {form.formState.errors.password && (
                <p className="text-red-600">
                  {form.formState.errors.password.message}
                </p>
              )}
              <PasswordValidation password={password} />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...form.register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === form.getValues("password") ||
                    "Passwords don't match",
                })}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-red-600">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Reset Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense
      fallback={<Loader2 className="h-8 w-8 animate-spin text-red-600" />}
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
