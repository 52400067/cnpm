// apps/web/src/app/(admin)/layout.tsx
import Link from "next/link";
import { ShieldCheck, CheckSquare, Users, Landmark } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-64 border-r border-slate-800 bg-slate-950 text-white flex flex-col p-5 gap-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
            <ShieldCheck className="size-4" />
          </div>
          <span className="text-lg font-extrabold tracking-tight">
            Admin <span className="text-rose-400">Portal</span>
          </span>
        </Link>

        <nav className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
          <Link
            href="/login"
            className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl hover:bg-slate-900 hover:text-white transition-colors"
          >
            <CheckSquare className="size-4 text-rose-400" />
            <span>Duyệt sự kiện</span>
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl hover:bg-slate-900 hover:text-white transition-colors"
          >
            <Users className="size-4 text-rose-400" />
            <span>Duyệt hồ sơ BTC</span>
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl hover:bg-slate-900 hover:text-white transition-colors"
          >
            <Landmark className="size-4 text-rose-400" />
            <span>Đối soát &amp; Chi trả</span>
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-background">{children}</main>
    </div>
  );
}
