import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, Lock, Loader2 } from "lucide-react";
import InputField from "./InputField";
import { useRouter } from "next/navigation";
import axios from "axios";
import { LoginFormProps, LoginInputs as OriginalLoginInputs } from "@/type";
import Cookies from "js-cookie";
import { useAuth } from "@/helper/AuthContext";
import GoogleButton from "./GoogleButton";
import { motion } from "framer-motion";

interface LoginInputs extends OriginalLoginInputs {
  [key: string]: unknown;
}

export default function LoginForm({
  handleLoading,
  setAuthMode,
  courseSlug,
}: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInputs>();

  const { checkAuth } = useAuth();
  const router = useRouter();

  const onSubmit: SubmitHandler<LoginInputs> = async (data) => {
    setIsLoading(true);
    handleLoading(true);
    try {
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/user/login`,
        data
      );

      const accessToken = result?.data?.data?.accessToken;
      Cookies.set("accessToken", accessToken, { expires: 7 });
      toast.success("Login successful!");

      const isAuthenticated = await checkAuth();
      if (isAuthenticated) {
        const userResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/user/check-auth`
        );

        if (userResponse.data && userResponse.data.success) {
          const user = userResponse.data.data.user;
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
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Login failed");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
      handleLoading(false);
    }
  };

  return (
    <motion.div
      className="w-full max-w-md mx-auto space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <GoogleButton mode="login" courseSlug={courseSlug} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">OR</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <InputField<LoginInputs>
          id="login-email"
          type="email"
          label="Email"
          placeholder="Enter your email..."
          icon={<Mail size={18} />}
          register={register}
          name="email"
          errors={errors}
          validationRules={{
            required: "Email is required",
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: "Invalid email address",
            },
          }}
        />

        <InputField<LoginInputs>
          id="login-password"
          type="password"
          label="Password"
          placeholder="Enter your password..."
          icon={<Lock size={18} />}
          register={register}
          name="password"
          errors={errors}
          validationRules={{
            required: "Password is required",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters",
            },
            validate: {
              hasUpperCase: (value: string) =>
                /[A-Z]/.test(value) ||
                "Password must contain at least one uppercase letter",
              hasLowerCase: (value: string) =>
                /[a-z]/.test(value) ||
                "Password must contain at least one lowercase letter",
              hasNumber: (value: string) =>
                /\d/.test(value) || "Password must contain at least one number",
              hasSpecialChar: (value: string) =>
                /[!@#$%^&*(),.?":{}|<>]/.test(value) ||
                "Password must contain at least one special character",
            },
          }}
          showPasswordToggle
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
        >
          {isLoading ? (
            <motion.div
              className="flex items-center justify-center gap-2"
              animate={{ opacity: [0.5, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Logging in...</span>
            </motion.div>
          ) : (
            "Login"
          )}
        </Button>


      </form>
    </motion.div>
  );
}