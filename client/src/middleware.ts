import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

interface UserDetails {
  id: string;
  email: string;
  role: "ADMIN" | "STUDENT";
  name: string;
}

const ROUTES = {
  public: ["/", "/about", "/contact", "/courses", "/blog","verify-email", "/reset-password"],
  auth: ["/auth", "/login", "/register"],
  admin: ["/dashboard", "/admin"],
  user: ["/user-profile", "/my-courses", "/settings"],
} as const;

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const accessToken = request.cookies.get("accessToken")?.value;
  let user: UserDetails | null = null;

  // Helper functions
  const redirect = (path: string) => NextResponse.redirect(new URL(path, request.url));
  const isPublicRoute = () => ROUTES.public.some(route => pathname.startsWith(route));
  const isAuthRoute = () => ROUTES.auth.some(route => pathname.startsWith(route));
  const isAdminRoute = () => ROUTES.admin.some(route => pathname.startsWith(route));
  const isUserRoute = () => ROUTES.user.some(route => pathname.startsWith(route));

  try {
    // Verify token and get user details
    if (!accessToken) {
      // If no token and trying to access protected routes
      if (isAdminRoute() || isUserRoute()) {
        return redirect("/auth");
      }
      // Allow access to public and auth routes
      if (isPublicRoute() || isAuthRoute()) {
        return NextResponse.next();
      }
      return redirect("/auth");
    }

    // Parse and verify token
    try {
      user = jwtDecode<UserDetails>(accessToken);
      if (!user || !user.id || !user.role) {
        throw new Error("Invalid token");
      }
    } catch {
      // Invalid token - clear it and redirect to auth
      const response = redirect("/auth");
      response.cookies.delete("accessToken");
      return response;
    }

    // Handle logout
    if (pathname === "/logout") {
      const response = redirect("/");
      response.cookies.delete("accessToken");
      return response;
    }

    // Auth routes - redirect logged in users
    if (isAuthRoute()) {
      return redirect(user.role === "ADMIN" ? "/dashboard" : "/user-profile");
    }

    // Admin routes - strict admin check
    if (isAdminRoute()) {
      if (user.role !== "ADMIN") {
        return redirect("/user-profile");
      }
      return NextResponse.next();
    }

    // User routes - authenticated users only
    if (isUserRoute()) {
      return NextResponse.next();
    }

    // Public routes - allow all authenticated users
    if (isPublicRoute()) {
      return NextResponse.next();
    }

    // Default - allow authenticated users
    return NextResponse.next();

  } catch (error) {
    console.error("Middleware error:", error);
    // Clear invalid token and redirect to auth
    const response = redirect("/auth");
    response.cookies.delete("accessToken");
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json).*)",
  ],
};