// apps/web/src/app/(auth)/layout.tsx
import Link from "next/link";
import { ShieldCheck, Ticket } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // Dùng bg-muted thay vì bg-slate
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Dùng bg-background và border-border */}
      <header className="h-16 border-b border-border bg-background px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
            <Ticket className="size-4" />
          </div>
          {/* Dùng text-foreground */}
          <span className="font-extrabold text-lg tracking-tight text-foreground">
            Ticket<span className="text-primary">Hub</span>
          </span>
        </Link>
        {/* Dùng text-muted-foreground */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="size-4 text-primary" />
          <span>Kết nối SSL</span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="py-4 text-center text-xs text-muted-foreground">
        © 2026 TicketHub Vietnam. Nền tảng bán vé trực tuyến.
      </footer>
    </div>
  );
}