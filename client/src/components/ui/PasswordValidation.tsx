import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordRequirement {
    text: string;
    isMet: boolean;
}

interface PasswordValidationProps {
    password: string;
    className?: string;
}

const PasswordValidation: React.FC<PasswordValidationProps> = ({
    password,
    className,
}) => {
    // Password validation rules
    const requirements: PasswordRequirement[] = [
        {
            text: "At least 8 characters",
            isMet: password.length >= 8,
        },
        {
            text: "At least one uppercase letter (A-Z)",
            isMet: /[A-Z]/.test(password),
        },
        {
            text: "At least one lowercase letter (a-z)",
            isMet: /[a-z]/.test(password),
        },
        {
            text: "At least one number (0-9)",
            isMet: /\d/.test(password),
        },
        {
            text: "At least one special character (!@#$%^&*(),.?\":{}|<>)",
            isMet: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        },
    ];

    const allRequirementsMet = requirements.every((req) => req.isMet);

    if (!password) return null;

    return (
        <div
            className={cn(
                "mt-2 p-3 bg-gray-50 border rounded-md text-sm",
                allRequirementsMet ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50",
                className
            )}
        >
            <p className="font-medium mb-2">
                {allRequirementsMet
                    ? "Password meets all requirements"
                    : "Your password must have:"}
            </p>
            <ul className="space-y-1">
                {requirements.map((requirement, index) => (
                    <li
                        key={index}
                        className={cn(
                            "flex items-center gap-2",
                            requirement.isMet ? "text-green-600" : "text-amber-600"
                        )}
                    >
                        {requirement.isMet ? (
                            <Check className="h-4 w-4 flex-shrink-0" />
                        ) : (
                            <X className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span>{requirement.text}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PasswordValidation;
