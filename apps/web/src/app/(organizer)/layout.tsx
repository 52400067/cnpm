// apps/web/src/app/(organizer)/layout.tsx
import Link from "next/link";
import { Ticket, CalendarPlus, BarChart3, Layers } from "lucide-react";

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-64 border-r border-slate-800 bg-slate-950 text-slate-100 flex flex-col p-5 gap-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary text-white flex items-center justify-center">
            <Ticket className="size-4 -rotate-12" />
          </div>
          <span className="text-lg font-extrabold tracking-tight">
            BTC <span className="text-emerald-400">Portal</span>
          </span>
        </Link>

        <nav className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
          <Link
            href="/"
            className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl hover:bg-slate-900 hover:text-white transition-colors"
          >
            <Layers className="size-4 text-emerald-400" />
            <span>Sự kiện của tôi</span>
          </Link>
          <Link
            href="/register?role=ORGANIZER"
            className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl hover:bg-slate-900 hover:text-white transition-colors"
          >
            <CalendarPlus className="size-4 text-emerald-400" />
            <span>Tạo sự kiện mới</span>
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl hover:bg-slate-900 hover:text-white transition-colors"
          >
            <BarChart3 className="size-4 text-emerald-400" />
            <span>Báo cáo doanh thu</span>
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-background">{children}</main>
    </div>
  );
}
