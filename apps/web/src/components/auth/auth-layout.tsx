"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Ticket,
  Armchair,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useAuthContext } from "./auth-context";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { roleTab } = useAuthContext();

  const isLoginPage = pathname === "/login";
  const isRegisterPage = pathname === "/register";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground selection:bg-primary/20">
      {/* ========================================================
          LEFT COLUMN: Header, Form (Vertically Centered), Footer
          ======================================================== */}
      <div className="w-full lg:w-[48%] xl:w-[45%] 2xl:w-[42%] flex flex-col min-h-screen justify-between p-4 sm:p-8 lg:p-10 shrink-0">
        {/* Header: Logo & Back Link */}
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

        {/* Form Container: Identical top/vertical alignment across all pages */}
        <main className="my-auto py-8 flex flex-col items-center justify-center w-full">
          <div className="w-full max-w-[480px]">{children}</div>
        </main>

        {/* Footer: Copyright only */}
        <footer className="py-3 text-center text-xs text-muted-foreground">
          © 2026 TicketHub Vietnam
        </footer>
      </div>

      {/* ========================================================
          RIGHT COLUMN: Context Panel (Desktop >= 1024px only)
          Token surface, task-oriented, zero stock photos, fade transition
          ======================================================== */}
      <aside
        aria-label="Thông tin bổ trợ"
        className="hidden lg:flex flex-1 bg-muted/40 border-l border-border p-8 xl:p-14 flex-col justify-center items-center relative overflow-hidden"
      >
        <div className="w-full max-w-md transition-opacity duration-200 motion-reduce:transition-none space-y-6">
          {/* CASE 1: Register Page - Organizer Tab */}
          {isRegisterPage && roleTab === "ORGANIZER" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold border border-primary/20">
                  Dành cho Ban Tổ Chức
                </span>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Sau khi đăng ký
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Quy trình 3 bước chuẩn hóa để bắt đầu phát hành vé và quản lý sự kiện:
                </p>
              </div>

              {/* 3 Numbered Steps */}
              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="size-7 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-sm font-bold text-foreground">
                      Xác nhận email
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Mở hộp thư điện tử và kích hoạt tài khoản qua liên kết bảo mật có hiệu lực trong 24 giờ.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="size-7 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-sm font-bold text-foreground">
                      Tạo sự kiện đầu tiên
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Chọn địa điểm tổ chức, sơ đồ chỗ ngồi chuẩn hóa và cấu hình các phân khu giá vé.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="size-7 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-sm font-bold text-foreground">
                      Phát hành và bán vé
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Kích hoạt mở bán trực tuyến và theo dõi doanh số, số lượng vé đã bán theo thời gian thực.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cropped, static, token-styled illustration of event dashboard */}
              <div className="rounded-xl border border-border bg-background p-4 shadow-2xs space-y-3 select-none">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-foreground">
                      Bảng theo dõi bán vé
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                    Đang mở bán
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-muted/60 border border-border/60 space-y-1">
                    <span className="text-[11px] text-muted-foreground block font-medium">
                      Vé đã bán
                    </span>
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      18.450 / 22.000
                    </span>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-primary w-[84%]" />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/60 border border-border/60 space-y-1">
                    <span className="text-[11px] text-muted-foreground block font-medium">
                      Doanh thu
                    </span>
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      2.767.500.000 ₫
                    </span>
                    <span className="text-[10px] text-primary font-semibold block mt-1">
                      +12% so với tháng trước
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CASE 2: Register Page - Buyer Tab */}
          {isRegisterPage && roleTab === "BUYER" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold border border-primary/20">
                  Dành cho Người Mua Vé
                </span>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Tiện ích cho người mua vé
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Trải nghiệm đặt vé minh bạch, thuận tiện và an toàn trên TicketHub:
                </p>
              </div>

              {/* 3 Short Items */}
              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="size-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                    <Ticket className="size-3.5" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-sm font-bold text-foreground">
                      Xem vé đã mua
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Tra cứu nhanh chóng toàn bộ đơn hàng và lịch sử vé đã đặt bất kỳ lúc nào ngay trong tài khoản.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="size-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                    <Armchair className="size-3.5" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-sm font-bold text-foreground">
                      Giữ chỗ trực quan
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Chọn vị trí ghế ngồi trực tiếp trên sơ đồ chuẩn hóa của từng nhà thi đấu và sân vận động.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="size-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                    <QrCode className="size-3.5" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-sm font-bold text-foreground">
                      Nhận mã QR vào cửa
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Mã vé điện tử hiển thị trực tiếp để soát vé tại cổng sự kiện mà không cần in vé giấy.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cropped, static, token-styled illustration of buyer ticket */}
              <div className="rounded-xl border border-border bg-background p-4 shadow-2xs space-y-3 select-none">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-border">
                  <span className="font-semibold text-foreground">
                    Vé điện tử TicketHub
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10.5px] font-semibold border border-emerald-200">
                    Đã thanh toán
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="size-16 rounded-lg bg-muted flex items-center justify-center border border-border shrink-0">
                    <QrCode className="size-10 text-foreground" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-bold text-foreground truncate">
                      Liveshow Âm Nhạc Mùa Thu 2026
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Khán đài A • Hàng 04 • Ghế 12
                    </p>
                    <p className="text-xs text-foreground font-semibold tabular-nums">
                      800.000 ₫
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CASE 3: Login Page */}
          {isLoginPage && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-foreground text-xs font-medium border border-border">
                  Hệ thống phân phối vé sự kiện
                </span>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Chào mừng quay trở lại
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Truy cập tài khoản để theo dõi vé đã mua hoặc quản lý sự kiện của bạn.
                </p>
              </div>

              {/* Neutral token-styled security card */}
              <div className="rounded-xl border border-border bg-background p-5 shadow-2xs space-y-3 select-none">
                <div className="flex items-start gap-3.5">
                  <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground">
                      Bảo mật tài khoản đa lớp
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Dữ liệu giao dịch và thông tin phiên làm việc được mã hóa theo chuẩn JWT an toàn.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CASE 4: Other Auth Pages (Forgot Password, Verify Email) */}
          {!isLoginPage && !isRegisterPage && (
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-foreground text-xs font-medium border border-border">
                Xác thực tài khoản
              </span>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Bảo vệ tài khoản TicketHub
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hệ thống xác thực giúp bảo vệ quyền sở hữu vé điện tử và tài sản của bạn.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
