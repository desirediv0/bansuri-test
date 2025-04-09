
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export default function RegistrationSuccessMessage() {
  return (
    <motion.div
      className="text-center space-y-6 p-6 bg-white rounded-xl border border-red-100"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
      >
        <CheckCircle2 className="w-16 h-16 mx-auto text-green-600" />
      </motion.div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">
          Registration Successful!
        </h3>
        <p className="text-gray-600">
          Please check your email to verify your account
        </p>
      </div>


    </motion.div>
  );
}