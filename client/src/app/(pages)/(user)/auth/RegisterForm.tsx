import { useForm, SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { User, Mail, Lock, Loader2 } from "lucide-react";
import InputField from "./InputField";
import axios from "axios";
import { RegisterFormProps, RegisterInputs } from "@/type";
import { useEffect, useState } from "react";
import GoogleButton from "./GoogleButton";
import { motion } from "framer-motion";
import PasswordValidation from "@/components/ui/PasswordValidation";

export default function RegisterForm({
  handleLoading,
  handleRegistrationSuccess,
}: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterInputs>();

  // Watch the password field
  const watchedPassword = watch("password", "");
  // Update password state when it changes
  useEffect(() => {
    setPassword(watchedPassword);
  }, [watchedPassword]);

  const onSubmit: SubmitHandler<RegisterInputs> = async (data) => {
    setIsLoading(true);
    handleLoading(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/user/register`,
        data
      );

      toast.success(
        "Registration successful! Please check your email to verify your account."
      );
      handleRegistrationSuccess();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Registration failed");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
      handleLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <InputField<RegisterInputs>
        id="register-name"
        type="text"
        label="Name"
        placeholder="Enter your name..."
        icon={<User className="h-4 w-4 text-gray-500" />}
        register={register}
        name="name"
        errors={errors}
        validationRules={{
          required: "Name is required",
          minLength: {
            value: 2,
            message: "Name must be at least 2 characters",
          },
        }}
      />
      <InputField<RegisterInputs>
        id="register-email"
        type="email"
        label="Email"
        placeholder="Enter your email..."
        icon={<Mail className="h-4 w-4 text-gray-500" />}
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
      <div className="space-y-0">
        <InputField<RegisterInputs>
          id="register-password"
          type="password"
          label="Password"
          placeholder="Enter your password..."
          icon={<Lock className="h-4 w-4 text-gray-500" />}
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
        {password && <PasswordValidation password={password} />}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Please wait...</span>
          </div>
        ) : (
          "Register"
        )}
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <GoogleButton mode="register" />
    </motion.form>
  );
}