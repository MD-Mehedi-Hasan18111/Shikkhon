import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE_NAME = "auth_token";

function getRoleDashboardUrl(role: string, baseUrl: string): URL {
  if (role === "teacher") {
    return new URL("/dashboard/teacher", baseUrl);
  } else if (role === "student" || role === "guardian") {
    return new URL("/dashboard/student", baseUrl);
  } else if (role === "super_admin" || role === "admin" || role === "staff") {
    return new URL("/admin", baseUrl);
  }
  return new URL("/dashboard", baseUrl);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

  const secret =
    process.env.JWT_SECRET || "temporary_dev_jwt_secret_change_in_production_12345";
  const encodedSecret = new TextEncoder().encode(secret);

  // 1. If user is visiting /login:
  if (pathname === "/login") {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, encodedSecret);
        const role = (payload.role as string) || "student";
        // User is already logged in, redirect away from login page to their dashboard
        return NextResponse.redirect(getRoleDashboardUrl(role, req.url));
      } catch {
        // Corrupt or expired token, clear cookie and allow visiting /login
        const response = NextResponse.next();
        response.cookies.delete(AUTH_COOKIE_NAME);
        return response;
      }
    }
    return NextResponse.next();
  }

  // 2. Protect /admin, /dashboard and /api/admin routes
  const isDashboardRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  const isAdminApiRoute = pathname.startsWith("/api/admin");

  if (!isDashboardRoute && !isAdminApiRoute) {
    return NextResponse.next();
  }

  // 3. User is NOT logged in: Block access to dashboard
  if (!token) {
    if (isAdminApiRoute) {
      return NextResponse.json(
        {
          success: false,
          message: "লগইন প্রয়োজন। অনুগ্রহ করে প্রথমে সাইন-ইন করুন।",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }
    // Redirect unauthenticated user directly to /login
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Verify Token with Jose (Edge Runtime compatible)
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    const role = (payload.role as string) || "student";

    // Role-based route guards
    const isSuperAdminOnly =
      pathname.startsWith("/dashboard/settings/admins") ||
      pathname.startsWith("/admin/settings/admins");
    const isAdminOnly =
      pathname.startsWith("/dashboard/settings") ||
      pathname.startsWith("/admin/settings") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/dashboard/teachers") ||
      pathname.startsWith("/dashboard/expenses") ||
      isAdminApiRoute;

    if (isSuperAdminOnly && role !== "super_admin") {
      if (isAdminApiRoute) {
        return NextResponse.json(
          {
            success: false,
            message: "এই কার্যক্রমে প্রবেশের জন্য প্রধান অ্যাডমিনের অনুমতি প্রয়োজন।",
            timestamp: new Date().toISOString(),
          },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }

    if (isAdminOnly && !["super_admin", "admin"].includes(role)) {
      if (isAdminApiRoute) {
        return NextResponse.json(
          {
            success: false,
            message: "এই সেকশনে প্রবেশের জন্য অ্যাডমিন পারমিশন প্রয়োজন।",
            timestamp: new Date().toISOString(),
          },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }

    // Teacher portal protection: Only teachers and admins
    const isTeacherRoute = pathname.startsWith("/dashboard/teacher");
    if (isTeacherRoute && !["super_admin", "admin", "teacher"].includes(role)) {
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }

    // Student portal protection: Only students, guardians and admins
    const isStudentRoute = pathname.startsWith("/dashboard/student");
    if (
      isStudentRoute &&
      !["super_admin", "admin", "student", "guardian"].includes(role)
    ) {
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }

    // Attach Verified User Identity Headers for Server Components
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", (payload.userId as string) || "");
    requestHeaders.set("x-user-role", role);
    requestHeaders.set("x-user-phone", (payload.phone as string) || "");

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    // If token is invalid or expired
    if (isAdminApiRoute) {
      return NextResponse.json(
        {
          success: false,
          message: "আপনার সেশনের মেয়াদ শেষ হয়েছে বা অবৈধ। পুনরায় লগইন করুন।",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);

    const response = NextResponse.redirect(loginUrl);
    // Clear corrupted/expired cookie
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/api/admin/:path*", "/login"],
};
