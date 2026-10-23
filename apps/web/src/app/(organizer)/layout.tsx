// apps/web/src/app/(organizer)/layout.tsx
import Link from "next/link";
import { Ticket, CalendarPlus, BarChart3, Layers, Home, ExternalLink } from "lucide-react";

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-64 border-r border-slate-800 bg-slate-950 text-slate-100 flex flex-col p-5 gap-6 shrink-0">
        <Link href="/organizer/events" className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary text-white flex items-center justify-center">
            <Ticket className="size-4 -rotate-12" />
          </div>
          <span className="text-lg font-extrabold tracking-tight">
            BTC <span className="text-emerald-400">Portal</span>
          </span>
        </Link>

        <nav className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
          <Link
            href="/organizer/events"
            className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl hover:bg-slate-900 hover:text-white transition-colors"
          >
            <Layers className="size-4 text-emerald-400" />
            <span>Sự kiện của tôi</span>
          </Link>
          <Link
            href="/organizer/events/new"
            className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl hover:bg-slate-900 hover:text-white transition-colors"
          >
            <CalendarPlus className="size-4 text-emerald-400" />
            <span>Tạo sự kiện &amp; Chọn sơ đồ</span>
          </Link>
          <Link
            href="/organizer/reports"
            className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl hover:bg-slate-900 hover:text-white transition-colors"
          >
            <BarChart3 className="size-4 text-emerald-400" />
            <span>Báo cáo doanh thu</span>
          </Link>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2.5 py-2 px-3 rounded-lg text-[13px] text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
          >
            <Home className="size-4" />
            <span>Về sàn TicketHub</span>
          </Link>
          <Link
            href="/events/evt-anh-trai-vuot-ngan-chong-gai"
            className="flex items-center gap-2.5 py-2 px-3 rounded-lg text-[13px] text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
          >
            <ExternalLink className="size-4" />
            <span>Xem mẫu sơ đồ trực tiếp</span>
          </Link>
        </div>
      </aside>
      <main className="flex-1 min-w-0 bg-[#f8fafc] text-foreground overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
