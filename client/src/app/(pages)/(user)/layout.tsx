"use client";

import React from "react";
import Header from "../_components/Header/Header";
import Footer from "../_components/Footer";
import { usePathname } from "next/navigation";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const hideHeaderPaths = [
    "/auth",
  ];

  const shouldShowHeader = !hideHeaderPaths.some(path =>
    pathname === path || pathname.startsWith(`${path}/`)
  );

  const hideFooterPaths = [
    "/auth",
  ];

  const shouldShowFooter = !hideFooterPaths.some(path =>
    pathname === path || pathname.startsWith(`${path}/`)
  );

  return (
    <div>
      {shouldShowHeader && <Header />}
      {children}
      {shouldShowFooter && <Footer />}
    </div>
  );
};

export default Layout;
