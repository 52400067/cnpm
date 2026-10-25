// apps/web/src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Giải mã nhanh JWT payload (nếu BE1 lưu token trong cookie) để lấy role
 */
function extractRoleFromJwt(token?: string): string | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8"),
    );
    return payload?.role || null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Cho phép bypass nhanh khi thêm ?demo=1 trên URL để test UI lúc tắt Backend
  if (searchParams.get("demo") === "1") {
    return NextResponse.next();
  }

  // Đọc Role từ Cookie (hỗ trợ cả cookie th_role lẫn JWT cookie từ BE1)
  const roleCookie = request.cookies.get("th_role")?.value;
  const accessCookie =
    request.cookies.get("accessToken")?.value ||
    request.cookies.get("access_token")?.value;

  const userRole = roleCookie || extractRoleFromJwt(accessCookie);

  // 1. Bảo vệ cụm Route ADMIN (/admin/*) -> Chỉ cho phép ADMIN
  if (pathname.startsWith("/admin")) {
    if (!userRole) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== "ADMIN") {
      const homeUrl = new URL("/", request.url);
      homeUrl.searchParams.set("error", "forbidden_admin");
      return NextResponse.redirect(homeUrl);
    }
  }

  // 2. Bảo vệ cụm Route ORGANIZER (/organizer/*) -> Chỉ cho phép ORGANIZER hoặc ADMIN
  if (pathname.startsWith("/organizer")) {
    if (!userRole) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== "ORGANIZER" && userRole !== "ADMIN") {
      const homeUrl = new URL("/", request.url);
      homeUrl.searchParams.set("error", "forbidden_organizer");
      return NextResponse.redirect(homeUrl);
    }
  }

  // 3. Bảo vệ trang Vé của tôi (/my-tickets/*) -> Yêu cầu đã đăng nhập
  if (pathname.startsWith("/my-tickets")) {
    if (!userRole) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/organizer/:path*", "/my-tickets/:path*"],
};