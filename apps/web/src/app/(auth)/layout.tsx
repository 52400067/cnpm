// apps/web/src/app/(auth)/layout.tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7f8] text-[#141d23]">
      <header className="h-16 border-b border-[#dfe3e5] bg-white px-4 sm:px-8 flex items-center justify-between">
        <Logo />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#606970] hover:text-primary transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Quay lại khám phá</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>

      <footer className="py-4 text-center text-[12px] text-[#606970]">
        © 2026 TicketHub Vietnam
      </footer>
    </div>
  );
}
