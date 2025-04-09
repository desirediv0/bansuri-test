import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BillingFormProps } from "@/type";
import { Checkbox } from "@/components/ui/checkbox";

export default function BillingForm({
  register,
  errors,
  user,
}: BillingFormProps) {
  return (
    <form className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-inter">
        <div>
          <Label htmlFor="fullName" className="text-gray-700">
            Full Name
          </Label>
          <Input
            id="fullName"
            placeholder="John Doe"
            className="mt-1 bg-gray-50"
            defaultValue={user?.name || ""}
            {...register("fullName", { required: "Full name is required" })}
          />
          {errors.fullName && (
            <p className="text-red-500 text-sm mt-1">
              {errors.fullName.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="email" className="text-gray-700">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            className="mt-1 bg-gray-50"
            defaultValue={user?.email || ""}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="address" className="text-gray-700">
            Address
          </Label>
          <Input
            id="address"
            placeholder="123 Main St"
            className="mt-1"
            {...register("address", { required: "Address is required" })}
          />
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">
              {errors.address.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="city" className="text-gray-700">
            City
          </Label>
          <Input
            id="city"
            placeholder="New York"
            className="mt-1"
            {...register("city", { required: "City is required" })}
          />
          {errors.city && (
            <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="state" className="text-gray-700">
            State
          </Label>
          <Input
            id="state"
            placeholder="Maharashtra"
            className="mt-1"
            {...register("state", {
              required: "State is required",
              minLength: {
                value: 2,
                message: "State must be at least 2 characters",
              },
            })}
          />
          {errors.state && (
            <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="country" className="text-gray-700">
            Country
          </Label>
          <Input
            id="country"
            placeholder="India"
            className="mt-1"
            {...register("country", { required: "Country is required" })}
          />
          {errors.country && (
            <p className="text-red-500 text-sm mt-1">
              {errors.country.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="zipCode" className="text-gray-700">
            PIN Code
          </Label>
          <Input
            id="zipCode"
            placeholder="400001"
            className="mt-1"
            {...register("zipCode", {
              required: "PIN code is required",
              pattern: {
                value: /^\d{6}$/,
                message: "Please enter a valid 6-digit PIN code",
              },
            })}
          />
          {errors.zipCode && (
            <p className="text-red-500 text-sm mt-1">
              {errors.zipCode.message}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg">
        <Checkbox
          id="saveAddress"
          className="h-5 w-5"
          {...register("saveAddress")}
        />
        <Label htmlFor="saveAddress" className="text-sm text-gray-600">
          Save this address for future purchases
        </Label>
      </div>
    </form>
  );
}
