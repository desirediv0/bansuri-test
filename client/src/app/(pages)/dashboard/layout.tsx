import type { Metadata } from "next";
import React from "react";
import { Sidenav } from "./_components/SideNav";
import { Toaster } from "@/components/ui/toaster";


export const metadata: Metadata = {
  title: "Dashboard | Bansuri Vidya Mandir | Indian Classical Music Institute",
  description: "Join Bansuri Vidya Mandir - A premier institute dedicated to teaching Indian classical flute (bansuri), traditional music education, and cultural arts. Experience authentic guru-shishya parampara with expert mentorship.",
};
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background font-plus-jakarta-sans">
      <Sidenav />
      <main className="md:pl-56 pt-4 md:pt-0">
        <div className="container mx-auto p-4 md:p-8">{children}</div>
        <Toaster />
      </main>
    </div>
  );
};

export default Layout;
