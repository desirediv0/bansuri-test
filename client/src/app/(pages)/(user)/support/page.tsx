import React from "react";
import { HeroSection } from "../../_components/HeroSectionProps";

const Support = () => {
  return (
    <>
      <HeroSection
        smallText="Support"
        title="Get help when you need it"
        variant="page"
      />
      <div className="flex items-center justify-center px-4 py-16 pt-24">
        <div className="max-w-3xl mx-auto bg-white">
          <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
            Support
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Welcome to our support page. We are committed to providing you with
            the best assistance possible. Our support team is available 24/7 to
            help you with any issues or questions you may have. Whether you need
            help with your account, have questions about our services, or need
            technical assistance, we are here to help. Please feel free to reach
            out to us through our contact form, email, or phone. We value your
            feedback and are always looking for ways to improve our services.
            Thank you for choosing our platform.
          </p>
        </div>
      </div>
    </>
  );
};

export default Support;
