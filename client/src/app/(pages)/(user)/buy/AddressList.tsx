import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddressListProps } from "@/type";

const AddressList: React.FC<AddressListProps> = ({
  addresses,
  onAddressSelect,
}) => {
  return (
    <div className="mt-8">
      {addresses?.length > 0 && (
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Saved Addresses
        </h3>
      )}
      <div className="space-y-4">
        {addresses?.map((address) => (
          <Card key={address.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">
                    {address.fullName}
                  </p>
                  <p className="text-gray-600">{address.email}</p>
                  <p className="text-gray-600">{address.address}</p>
                  <p className="text-gray-600">
                    {address.city}, {address.state}, {address.country} -{" "}
                    {address.zipCode}
                  </p>
                </div>
                <Button
                  onClick={() => onAddressSelect(address)}
                  variant="outline"
                  size="sm"
                >
                  Use This Address
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AddressList;
