// apps/web/src/app/(organizer)/layout.tsx
import Link from "next/link";
import { CalendarPlus, Layers, ArrowUpRight, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7f8] text-[#141d23]">
      {/* Top announcement bar matching public & event layouts */}
      <div className="bg-[#0c141a] text-white text-[11.5px] py-1.5 px-4 text-center">
        <p className="max-w-[1200px] mx-auto truncate">
          TicketHub dành cho Ban Tổ Chức: Hệ thống địa điểm chuẩn (Curated Venues) và sơ đồ khán đài SVG tại TP. Hồ Chí Minh, Hà Nội, Đà Nẵng.
        </p>
      </div>

      {/* Main horizontal header matching PublicLayout and BuyerLayout */}
      <header className="sticky top-0 z-30 border-b border-[#dfe3e5] bg-white/95 backdrop-blur-xs">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Official Logo + Organizer Portal Navigation */}
          <div className="flex items-center gap-4 sm:gap-5">
            <Logo />
            <span className="h-4 w-px bg-[#dfe3e5] hidden sm:block" />
            <span className="text-[13.5px] font-extrabold text-[#141d23] hidden sm:inline tracking-tight">
              Ban Tổ Chức
            </span>

            <nav
              aria-label="Điều hướng Ban tổ chức"
              className="flex items-center gap-1 sm:ml-2 text-[13px] font-semibold"
            >
              <Link
                href="/organizer/events"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[#141d23] hover:bg-[#eff1f2] hover:text-primary transition-colors"
              >
                <Layers className="size-3.5 text-primary" />
                <span>Sự kiện của tôi</span>
              </Link>
              <Link
                href="/organizer/events/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[#141d23] hover:bg-[#eff1f2] hover:text-primary transition-colors"
              >
                <CalendarPlus className="size-3.5 text-primary" />
                <span className="hidden md:inline">Tạo sự kiện &amp; Chọn sơ đồ</span>
                <span className="md:hidden">Tạo mới</span>
              </Link>
            </nav>
          </div>

          {/* Right: Quick links & Primary Pill Action */}
          <div className="flex items-center gap-3 sm:gap-4 text-[13px] font-medium">
            <Link
              href="/events/evt-anh-trai-vuot-ngan-chong-gai"
              className="hidden lg:inline-flex items-center gap-1 text-[#606970] hover:text-primary transition-colors"
            >
              <span>Xem mẫu sơ đồ trực tiếp</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
            <Link
              href="/"
              className="text-[#606970] hover:text-[#141d23] transition-colors"
            >
              Về sàn mua vé
            </Link>
            <Link
              href="/organizer/events/new"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-primary hover:bg-emerald-700 text-white text-[12.5px] font-bold transition-colors shadow-2xs"
            >
              <CalendarPlus className="size-3.5" />
              <span>Tạo sự kiện</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Compact Organizer Footer */}
      <footer className="border-t border-[#dfe3e5] bg-white py-5 mt-12">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#606970]">
          <div className="flex items-center gap-2">
            <span className="size-5 rounded-full bg-emerald-50 text-primary flex items-center justify-center">
              <ShieldCheck className="size-3.5" />
            </span>
            <span>
              <strong className="text-[#141d23]">TicketHub Organizer Portal</strong> • Chuẩn hóa sơ đồ khán đài SVG &amp; phát hành vé chống giả mạo
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-[#141d23] transition-colors">
              Trang chủ người mua
            </Link>
            <Link href="/my-tickets" className="hover:text-[#141d23] transition-colors">
              Vé của tôi
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
