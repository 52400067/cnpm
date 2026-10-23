"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Ticket,
  Armchair,
  QrCode,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useAuthContext } from "./auth-context";

// Neutral token-styled seating-map illustration with no fake event name, price, or payment status
function NeutralSeatMapIllustration() {
  return (
    <div className="rounded-xl border border-border bg-background p-3.5 shadow-2xs space-y-2.5 select-none">
      <div className="flex items-center justify-between text-xs pb-1.5 border-b border-border">
        <span className="font-semibold text-foreground text-xs">
          Sơ đồ chỗ ngồi
        </span>
        <span className="text-[11px] text-muted-foreground">
          Khán đài mẫu
        </span>
      </div>

      {/* Mini Visual Diagram */}
      <div className="p-2.5 bg-muted/40 rounded-lg border border-border/60 space-y-2">
        {/* Stage representation */}
        <div className="w-1/2 mx-auto py-0.5 bg-secondary text-secondary-foreground text-[10px] font-semibold text-center rounded border border-border tracking-wider uppercase">
          Sân khấu
        </div>

        {/* Section rows */}
        <div className="space-y-1 pt-0.5">
          <div className="grid grid-cols-8 gap-1.5 px-2">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-2 rounded-xs bg-primary/40 border border-primary/50"
              />
            ))}
          </div>
          <div className="grid grid-cols-10 gap-1.5">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="h-2 rounded-xs bg-muted-foreground/30 border border-border"
              />
            ))}
          </div>
          <div className="grid grid-cols-10 gap-1.5">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="h-2 rounded-xs bg-muted-foreground/20 border border-border"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-xs bg-primary/40 border border-primary/50" />
          Khu VIP
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-xs bg-muted-foreground/30 border border-border" />
          Khu Tiêu chuẩn
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-xs bg-muted-foreground/20 border border-border" />
          Khán đài tầng
        </span>
      </div>
    </div>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { roleTab } = useAuthContext();

  const isLoginPage = pathname === "/login";
  const isRegisterPage = pathname === "/register";

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between bg-background text-foreground selection:bg-primary/20">
      {/* Main Two-Column Container */}
      <div className="flex-1 flex flex-col lg:flex-row items-stretch">
        {/* ========================================================
            LEFT COLUMN: Header, Form (Centered, max-w ~440px), Footer
            Header edges align with column horizontal padding
            ======================================================== */}
        <div className="w-full lg:w-[48%] xl:w-[45%] 2xl:w-[42%] flex flex-col justify-between px-6 sm:px-10 lg:px-12 shrink-0">
          {/* Header: Logo left-aligned to padding, Back link right-aligned */}
          <header className="h-14 flex items-center justify-between w-full">
            <Logo />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-2 py-1"
            >
              <ArrowLeft className="size-4" />
              <span>Quay lại khám phá</span>
            </Link>
          </header>

          {/* Form Content: Shared top offset pt-4 sm:pt-6 lg:pt-6 matching right panel */}
          <main className="flex-1 pt-4 sm:pt-6 lg:pt-6 pb-2 flex flex-col items-center w-full">
            <div className="w-full max-w-[440px]">{children}</div>
          </main>

          {/* Left Footer spacer / copyright */}
          <footer className="h-10 flex items-center justify-center text-xs text-muted-foreground w-full">
            © 2026 TicketHub Vietnam
          </footer>
        </div>

        {/* ========================================================
            RIGHT COLUMN: Context Panel (Desktop >= 1024px only)
            Token surface, shared top offset, comparable structure, no jargon
            ======================================================== */}
        <aside
          aria-label="Thông tin bổ trợ"
          className="hidden lg:flex flex-1 bg-muted/40 border-l border-border px-8 xl:px-14 flex-col justify-between"
        >
          {/* Header Spacer (matching Left Column h-14) */}
          <div className="h-14 w-full" aria-hidden="true" />

          {/* Panel Content: Shared top offset pt-4 sm:pt-6 lg:pt-6 matching left form */}
          <div className="flex-1 pt-4 sm:pt-6 lg:pt-6 pb-2 flex flex-col items-center w-full">
            <div className="w-full max-w-[440px] transition-opacity duration-200 motion-reduce:transition-none space-y-5">
              {/* CASE 1: Register Page - Organizer Tab */}
              {isRegisterPage && roleTab === "ORGANIZER" && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      Sau khi đăng ký
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Quy trình phát hành vé dành cho ban tổ chức:
                    </p>
                  </div>

                  {/* 3 Numbered Steps (short factual sentences) */}
                  <div className="space-y-3.5">
                    <div className="flex items-start gap-3">
                      <div className="size-7 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h3 className="text-sm font-bold text-foreground">
                          Xác nhận email
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Kích hoạt tài khoản qua liên kết trong hộp thư.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="size-7 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h3 className="text-sm font-bold text-foreground">
                          Tạo sự kiện đầu tiên
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Thiết lập địa điểm, sơ đồ chỗ ngồi và giá vé.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="size-7 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h3 className="text-sm font-bold text-foreground">
                          Phát hành và bán vé
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Mở bán trực tuyến và theo dõi số lượng vé đã bán.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Neutral SeatMap Illustration */}
                  <NeutralSeatMapIllustration />
                </div>
              )}

              {/* CASE 2: Register Page - Buyer Tab */}
              {isRegisterPage && roleTab === "BUYER" && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      Dành cho người mua vé
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Tiện ích hỗ trợ quản lý và sử dụng vé:
                    </p>
                  </div>

                  {/* 3 Short Items (buyer copy) */}
                  <div className="space-y-3.5">
                    <div className="flex items-start gap-3">
                      <div className="size-7 rounded-full bg-secondary text-foreground font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-border">
                        <Ticket className="size-3.5 text-primary" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h3 className="text-sm font-bold text-foreground">
                          Xem vé đã mua
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Tra cứu đơn hàng và vé đã đặt trong tài khoản.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="size-7 rounded-full bg-secondary text-foreground font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-border">
                        <Armchair className="size-3.5 text-primary" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h3 className="text-sm font-bold text-foreground">
                          Giữ chỗ
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Chọn đúng ghế bạn muốn trên sơ đồ chỗ ngồi.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="size-7 rounded-full bg-secondary text-foreground font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-border">
                        <QrCode className="size-3.5 text-primary" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h3 className="text-sm font-bold text-foreground">
                          Mã QR vào cửa
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Dùng mã QR trên điện thoại để vào sự kiện.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Neutral SeatMap Illustration */}
                  <NeutralSeatMapIllustration />
                </div>
              )}

              {/* CASE 3: Login Page - Comparable structure & weight */}
              {isLoginPage && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      Sau khi đăng nhập
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Truy cập các tính năng quản lý tài khoản:
                    </p>
                  </div>

                  {/* 3 Short Items (equal structure to register) */}
                  <div className="space-y-3.5">
                    <div className="flex items-start gap-3">
                      <div className="size-7 rounded-full bg-secondary text-foreground font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-border">
                        <Ticket className="size-3.5 text-primary" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h3 className="text-sm font-bold text-foreground">
                          Xem vé đã mua
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Tra cứu đơn hàng và vé đã đặt trong tài khoản.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="size-7 rounded-full bg-secondary text-foreground font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-border">
                        <Calendar className="size-3.5 text-primary" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h3 className="text-sm font-bold text-foreground">
                          Quản lý sự kiện của bạn
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Chỉnh sửa thông tin và cấu hình các sự kiện của bạn.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="size-7 rounded-full bg-secondary text-foreground font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-border">
                        <TrendingUp className="size-3.5 text-primary" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h3 className="text-sm font-bold text-foreground">
                          Theo dõi doanh số
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Xem số lượng vé đã bán và doanh thu thực tế.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Neutral SeatMap Illustration */}
                  <NeutralSeatMapIllustration />
                </div>
              )}

              {/* CASE 4: Other Auth Pages (Forgot Password, Verify Email) */}
              {!isLoginPage && !isRegisterPage && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      Xác thực tài khoản
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Bảo vệ thông tin cá nhân và vé điện tử của bạn.
                    </p>
                  </div>
                  <NeutralSeatMapIllustration />
                </div>
              )}
            </div>
          </div>

          {/* Right Footer Spacer (matching Left Column h-10) */}
          <div className="h-10 w-full" aria-hidden="true" />
        </aside>
      </div>
    </div>
  );
}
