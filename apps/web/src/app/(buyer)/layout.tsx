export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white px-6 py-3 flex justify-between items-center">
        <span className="font-semibold text-lg">Cổng Người Mua Vé</span>
        <div className="text-sm text-muted-foreground">Tài khoản Buyer</div>
      </header>
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">{children}</main>
    </div>
  );
}