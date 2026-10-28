import Link from "next/link";
import { Ticket } from "lucide-react";

/**
 * Trang "Vé của tôi" - placeholder.
 * Danh sách vé + mã QR động (UC07) chỉ hiển thị khi đơn đã thanh toán (UC05),
 * dữ liệu lấy từ backend. Chưa có thì không hiển thị vé giả.
 */
export default function MyTicketsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-foreground">
          Vé của tôi
        </h1>
        <p className="text-[14px] text-muted-foreground">
          Quản lý các vé sự kiện điện tử bạn đã đặt trên TicketHub
        </p>
      </div>

      <div className="rounded-[16px] border border-dashed border-border bg-background p-8 max-w-3xl text-center space-y-3">
        <Ticket className="size-8 text-primary mx-auto" />
        <p className="text-[15px] font-bold text-foreground">
          Bạn chưa có vé nào
        </p>
        <p className="text-[13px] text-muted-foreground">
          Vé và mã QR vào cổng sẽ xuất hiện tại đây sau khi thanh toán thành công.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-primary text-primary-foreground text-[13px] font-bold hover:bg-emerald-700 transition-colors"
        >
          Khám phá sự kiện
        </Link>
      </div>
    </div>
  );
}
