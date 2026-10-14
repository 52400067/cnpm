export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar Admin */}
      <aside className="w-64 border-r bg-red-950 text-white flex flex-col p-4 gap-4">
        <div className="text-lg font-bold">Admin Portal</div>
        <nav className="flex flex-col gap-2 text-sm text-red-100">
          <span className="py-2 px-3 rounded hover:bg-red-900 cursor-pointer">Duyệt sự kiện</span>
          <span className="py-2 px-3 rounded hover:bg-red-900 cursor-pointer">Duyệt hồ sơ BTC</span>
          <span className="py-2 px-3 rounded hover:bg-red-900 cursor-pointer">Đối soát & Chi trả</span>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-slate-50">{children}</main>
    </div>
  );
}