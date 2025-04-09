import React from "react";
import { HeroSection } from "../../_components/HeroSectionProps";

const PrivacyPolicy = () => {
  return (
    <>
      <HeroSection
        smallText="Privacy Policy"
        title="Your Privacy Matters"
        variant="page"
      />
      <div className="flex items-center justify-center px-4 py-16 pt-24">
        <div className="max-w-3xl mx-auto bg-white">
          <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Welcome to our Privacy Policy page. We are committed to protecting
            your personal information and your right to privacy. This policy
            outlines how we collect, use, and safeguard your information when
            you visit our website or use our services. We ensure that your data
            is handled securely and in compliance with applicable laws and
            regulations. If you have any questions or concerns about our
            practices, please feel free to contact us. Thank you for trusting us
            with your personal information.
          </p>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
