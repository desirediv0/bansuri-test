import { Button } from "@/components/ui/button";
import { AuthModeToggleProps } from "@/type";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthModeToggle({
  authMode,
  setAuthMode,
}: AuthModeToggleProps) {
  return (
    <motion.div
      className="w-full text-center mt-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      {authMode !== "login" ? (
        <Button
          variant="ghost"
          onClick={() => setAuthMode("login")}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Back to Login</span>
        </Button>
      ) : (
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => setAuthMode("register")}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
          >
            Need an account? <span className="font-semibold ml-1">Register</span>
          </Button>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Button
              variant="link"
              onClick={() => setAuthMode("forgotPassword")}
              className="text-gray-500 hover:text-red-600 transition-colors duration-200"
            >
              Forgot Password?
            </Button>
            <span>•</span>
            <Button
              variant="link"
              onClick={() => setAuthMode("resendVerification")}
              className="text-gray-500 hover:text-red-600 transition-colors duration-200"
            >
              Resend Verification
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}