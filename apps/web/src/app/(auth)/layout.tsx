// apps/web/src/app/(auth)/layout.tsx
import Link from "next/link";
import { ShieldCheck, Ticket } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70">
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-xs">
            <Ticket className="size-4" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900">
            Ticket<span className="text-primary">Hub</span>
          </span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <ShieldCheck className="size-4 text-primary" />
          <span>Kết nối bảo mật SSL</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-400">
        © 2026 TicketHub Vietnam · Hệ thống bán vé sự kiện trực tuyến
      </footer>
    </div>
  );
}
