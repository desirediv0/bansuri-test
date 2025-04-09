"use client";

import React, { MouseEventHandler, ReactNode } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface CustomButtonProps {
  primaryText: string;
  secondaryText?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  icon?: ReactNode;
  className?: string;
  href?: string;
  variant?: 'filled' | 'outlined';
  bgColor?: string;
  textColor?: string;
  hoverBgColor?: string;
  hoverTextColor?: string;
}

const CustomButton = ({
  primaryText,
  secondaryText,
  onClick,
  icon,
  href,
  className,
  variant = "filled",
  bgColor,
  textColor,
  hoverBgColor,
  hoverTextColor,
}: CustomButtonProps) => {
  const ButtonContent = () => (
    <>
      {/* Primary Text */}
      <div className="absolute inset-0 flex items-center justify-center transform transition-all duration-300 ease-out group-hover:-translate-y-full">
        <div className="flex items-center gap-2">
          {icon}
          <span>{primaryText}</span>
        </div>
      </div>

      {/* Secondary Text */}
      <div className="absolute inset-0 flex items-center justify-center transform transition-all duration-300 ease-out translate-y-full group-hover:translate-y-0">
        <div className="flex items-center gap-2">
          {icon}
          <span>{secondaryText}</span>
        </div>
      </div>
    </>
  );

  const getCustomStyles = () => {
    const styles: { [key: string]: string } = {};
    if (bgColor) styles["--btn-bg"] = bgColor;
    if (textColor) styles["--btn-text"] = textColor;
    if (hoverBgColor) styles["--btn-hover-bg"] = hoverBgColor;
    if (hoverTextColor) styles["--btn-hover-text"] = hoverTextColor;
    return styles as React.CSSProperties;
  };

  const variantClasses = {
    filled: cn(
      bgColor
        ? "bg-[var(--btn-bg)] text-[var(--btn-text)] hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)]"
        : "bg-white text-gray-900 hover:bg-gray-50"
    ),
    outlined: cn(
      bgColor
        ? "bg-transparent border-2 border-[var(--btn-bg)] text-[var(--btn-text)] hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)]"
        : "bg-transparent border-2 border-white text-white hover:bg-white/10"
    ),
  };

  const commonClasses = cn(
    "group relative inline-flex items-center justify-center",
    "h-12 px-6 min-w-[140px]",
    "rounded-full overflow-hidden",
    "transition-all duration-300 ease-out",
    "hover:shadow-lg active:scale-[0.98]",
    variantClasses[variant],
    className
  );

  if (href) {
    return (
      <Link href={href} className={commonClasses} style={getCustomStyles()}>
        <ButtonContent />
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={commonClasses}
      style={getCustomStyles()}
    >
      <ButtonContent />
    </button>
  );
};

export default CustomButton;
