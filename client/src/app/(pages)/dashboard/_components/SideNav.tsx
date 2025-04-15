"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  GraduationCap,
  MapPinHouse,
  Menu,
  Puzzle,
  School,
  ShoppingBasket,
  // Wallet,
  BookOpen,
  FilePlus,
  FileText,
  MessageSquare,
  Award,
  Folder,
  KeyRound,
  Video,
  // Eye
} from "lucide-react";
import { NavItem } from "@/type";

const navItems: NavItem[] = [
  {
    title: "My Courses",
    href: "/dashboard",
    icon: BookOpen,
  },
  {
    title: "Course Access",
    href: "/dashboard/access-course",
    icon: KeyRound,
  },
  {
    title: "Categories",
    href: "/dashboard/categories",
    icon: Folder,
  },
  {
    title: "Student List",
    href: "/dashboard/students",
    icon: School,
  },
  // {
  //   title: "Course Access",
  //   href: "/dashboard/visibility",
  //   icon: Eye,
  // },
  {
    title: "Reviews",
    href: "/dashboard/reviews",
    icon: MessageSquare,
  },
  {
    title: "New Course",
    href: "/dashboard/create-course",
    icon: FilePlus,
  },
  {
    title: "Saved Drafts",
    href: "/dashboard/draft-courses",
    icon: FileText,
  },
  {
    title: "Discount Codes",
    href: "/dashboard/coupons",
    icon: Puzzle,
  },
  {
    title: "Location",
    href: "/dashboard/address",
    icon: MapPinHouse,
  },
  {
    title: "Sales History",
    href: "/dashboard/purchase",
    icon: ShoppingBasket,
  },
  // {
  //   title: "Revenue",
  //   href: "/dashboard/fees",
  //   icon: Wallet,
  // },
  {
    title: "Certificates",
    href: "/dashboard/certificates",
    icon: Award,
  },
  {
    title: "Live Classes",
    href: "/dashboard/zoom",
    icon: Video,
  },
  {
    title: "Contact Messages",
    href: "/dashboard/contacts",
    icon: MessageSquare,
  },
];

export function Sidenav() {
  const pathname = usePathname();

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-40 md:hidden hover:bg-red-500/10"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-56 p-0 bg-gradient-to-b from-red-50 to-white"
        >
          <MobileNav />
        </SheetContent>
      </Sheet>
      <nav className="hidden md:block fixed top-0 left-0 h-full w-56 bg-gradient-to-b from-red-50 to-white border-r border-red-100/40 shadow-sm">
        <ScrollArea className="h-full">
          <div className="px-6 py-8">
            <div className="flex items-center gap-2 mb-8">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-200">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                  Admin Portal
                </h1>
                <p className="text-xs text-red-600/80">Manage your courses</p>
              </div>
            </div>
            <SidenavItems />
          </div>
        </ScrollArea>
      </nav>
    </>
  );
}

function SidenavItems() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <span
              className={cn(
                "group flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out",
                pathname === item.href
                  ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-200"
                  : "text-gray-600 hover:bg-red-100/50 hover:text-red-600 hover:shadow-sm"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-4 w-4 transition-transform duration-200 ease-in-out group-hover:scale-110",
                  pathname === item.href
                    ? "text-white"
                    : "text-gray-400 group-hover:text-red-500"
                )}
              />
              <span>{item.title}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-auto space-y-4">
        <Separator />
        <Link href="/courses">
          <span className="flex items-center rounded-xl px-4 py-3 text-sm font-medium bg-gradient-to-r from-red-50 to-red-100/50 text-red-600 hover:from-red-100 hover:to-red-200/50 transition-colors shadow-sm">
            <GraduationCap className="mr-3 h-5 w-5" />
            <span>View All Courses</span>
          </span>
        </Link>
      </div>
    </div>
  );
}

function MobileNav() {
  return (
    <ScrollArea className="h-full">
      <div className="px-6 py-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-200">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
              Admin Portal
            </h1>
            <p className="text-xs text-red-600/80">Manage your courses</p>
          </div>
        </div>
        <SidenavItems />
      </div>
    </ScrollArea>
  );
}

function Separator() {
  return (
    <div className="h-px bg-gradient-to-r from-red-100/50 via-red-200/50 to-red-100/50 my-4" />
  );
}
