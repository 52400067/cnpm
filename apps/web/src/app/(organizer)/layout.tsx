export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar BTC */}
      <aside className="w-64 border-r bg-slate-900 text-slate-100 flex flex-col p-4 gap-4">
        <div className="text-lg font-bold">BTC Portal</div>
        <nav className="flex flex-col gap-2 text-sm">
          <span className="py-2 px-3 rounded hover:bg-slate-800 cursor-pointer">
            Sự kiện của tôi
          </span>
          <span className="py-2 px-3 rounded hover:bg-slate-800 cursor-pointer">
            Tạo sự kiện mới
          </span>
          <span className="py-2 px-3 rounded hover:bg-slate-800 cursor-pointer">
            Báo cáo doanh thu
          </span>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-slate-50">{children}</main>
    </div>
  );
}
