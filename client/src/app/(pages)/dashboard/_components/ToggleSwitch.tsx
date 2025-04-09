import React from "react";
import { Switch } from "@/components/ui/switch";

interface ToggleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  activeColor?: string;
  activeIcon?: React.ReactNode;
  inactiveIcon?: React.ReactNode;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onCheckedChange,
  label,
  activeColor = "bg-blue-500",
  activeIcon,
  inactiveIcon,
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={`${checked ? activeColor : "bg-gray-200"}`}
      />
      <span className="font-medium text-sm">
        {checked ? (
          <span
            className={`text-${activeColor.replace(
              "bg-",
              ""
            )} flex items-center`}
          >
            {activeIcon}
            <span className="ml-1">{label}</span>
          </span>
        ) : (
          <span className="text-gray-500 flex items-center">
            {inactiveIcon}
            <span className="ml-1">{label}</span>
          </span>
        )}
      </span>
    </div>
  );
};
