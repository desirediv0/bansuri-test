"use client";

import { Suspense } from "react";
import { GoogleAuthProvider } from "./GoogleAuthProvider";
import { AuthProvider } from "./AuthContext";
import { Toaster } from "@/components/ui/sonner";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GoogleAuthProvider>
        <Suspense fallback={<div>Loading auth...</div>}>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </Suspense>
      </GoogleAuthProvider>
    </Suspense>
  );
}
