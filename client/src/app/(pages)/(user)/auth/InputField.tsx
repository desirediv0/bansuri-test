import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { Path, UseFormRegister, FieldErrors } from "react-hook-form";

export type InputFieldProps<T extends Record<string, unknown>> = {
  id: string;
  type: string;
  label: string;
  icon: React.ReactNode;
  register: UseFormRegister<T>;
  name: Path<T>;
  errors: FieldErrors<T>;
  validationRules?: Record<string, unknown>;
  showPasswordToggle?: boolean;
  placeholder?: string;
};

export default function InputField<T extends Record<string, unknown>>({
  id,
  type,
  label,
  icon,
  register,
  name,
  errors,
  validationRules,
  showPasswordToggle,
  placeholder,
}: InputFieldProps<T>) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {icon}
        </span>
        <Input
          id={id}
          type={showPasswordToggle && showPassword ? "text" : type}
          placeholder={placeholder}
          className={`pl-10 ${showPasswordToggle ? "pr-10" : ""}`}
          {...register(name, validationRules)}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {errors[name] && (
        <p className="text-red-500 text-sm">
          {errors[name]?.message as string}
        </p>
      )}
    </div>
  );
}
