import React from "react";
import { HeroSection } from "../../_components/HeroSectionProps";

const Refund = () => {
  return (
    <>
      <HeroSection
        smallText="Refund Policy"
        title="Our Refund Policy"
        variant="page"
      />
      <div className=" flex items-center justify-center px-4 py-16 pt-24">
        <div className="max-w-3xl mx-auto bg-white">
          <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
            Refund Policy
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Welcome to our Refund Policy page. We understand that sometimes
            things don't go as planned, and you may need to request a refund.
            This policy outlines the conditions under which refunds are granted
            and the process for requesting a refund. We strive to ensure that
            our refund process is fair and transparent. If you have any
            questions or concerns about our refund policy, please feel free to
            contact us. Thank you for choosing our platform.
          </p>
        </div>
      </div>
    </>
  );
};

export default Refund;
