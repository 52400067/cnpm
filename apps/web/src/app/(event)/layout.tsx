export default function EventBookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-white text-[#141d23] overflow-hidden">
      {/* Top slim announcement bar */}
      <div className="bg-[#0c141a] text-white text-[11px] py-1 px-4 text-center shrink-0">
        <p className="max-w-[1200px] mx-auto truncate">
          TicketHub là nền tảng phân phối vé sự kiện trực tiếp hàng đầu tại Việt Nam. Cam kết vé chính thức 100%.
        </p>
      </div>

      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}
