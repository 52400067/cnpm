import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white py-3 px-6 flex justify-between items-center shadow-sm">
        <div className="font-bold text-xl text-primary">TicketHub</div>
        <nav className="flex gap-4 text-sm font-medium">
          <Link href="/" className="hover:text-primary transition-colors">
            Trang chủ
          </Link>
          <Link href="/login" className="hover:text-primary transition-colors">
            Đăng nhập
          </Link>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        © 2026 TicketHub - Nền tảng bán vé sự kiện trực tuyến
      </footer>
    </div>
  );
}