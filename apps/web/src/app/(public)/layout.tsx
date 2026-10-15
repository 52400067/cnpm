// apps/web/src/app/(public)/layout.tsx
import Link from "next/link";
import { Bell, Heart, Ticket, User, Globe } from "lucide-react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      {/* Top Banner */}
      <div className="bg-zinc-900 text-zinc-100 text-xs py-2 px-4 text-center font-medium">
        TicketHub — Nền tảng săn vé sự kiện, concert và thể thao trực tuyến
        nhanh chóng, an toàn.
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand thẳng hàng hiện đại & Categories */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
                <Ticket className="size-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Ticket<span className="text-primary">Hub</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link
                href="/?category=CONCERT"
                className="hover:text-primary transition-colors"
              >
                Hòa nhạc
              </Link>
              <Link
                href="/?category=SPORT"
                className="hover:text-primary transition-colors"
              >
                Thể thao
              </Link>
              <Link
                href="/?category=THEATER"
                className="hover:text-primary transition-colors"
              >
                Sân khấu & Hài kịch
              </Link>
              <Link
                href="/?category=FESTIVAL"
                className="hover:text-primary transition-colors"
              >
                Lễ hội
              </Link>
              <Link
                href="/?city=HCM"
                className="hover:text-primary transition-colors"
              >
                Thành phố lớn
              </Link>
            </nav>
          </div>

          {/* Right: Actions & User Auth */}
          <div className="flex items-center gap-5 text-sm font-medium text-slate-600">
            <Link
              href="/register?role=ORGANIZER"
              className="hidden lg:inline-block hover:text-primary transition-colors"
            >
              Tạo sự kiện (BTC)
            </Link>
            <Link
              href="/login"
              className="hidden sm:flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Heart className="size-4" />
              <span>Yêu thích</span>
            </Link>
            <Link
              href="/login"
              className="hidden sm:flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Ticket className="size-4" />
              <span>Vé của tôi</span>
            </Link>
            <Link
              href="/login"
              className="text-slate-900 font-semibold hover:text-primary transition-colors"
            >
              Đăng nhập
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                aria-label="Tài khoản"
                className="size-9 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-primary flex items-center justify-center text-slate-700 transition-colors"
              >
                <User className="size-4" />
              </Link>
              <button
                type="button"
                aria-label="Thông báo"
                className="relative size-9 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-primary flex items-center justify-center text-slate-700 transition-colors"
              >
                <Bell className="size-4" />
                <span className="absolute top-1.5 right-2 size-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900">
              Ticket<span className="text-primary">Hub</span>
            </span>
            <span>© 2026 TicketHub Vietnam.</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/login" className="hover:text-slate-900">
              Điều khoản sử dụng
            </Link>
            <Link href="/login" className="hover:text-slate-900">
              Chính sách bảo mật
            </Link>
            <Link href="/login" className="hover:text-slate-900">
              Hướng dẫn mua vé
            </Link>
            <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
              <Globe className="size-3.5" /> Tiếng Việt (VNĐ)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
