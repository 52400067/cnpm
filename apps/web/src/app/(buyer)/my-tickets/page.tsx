// apps/web/src/app/(buyer)/my-tickets/page.tsx
import Link from "next/link";
import { Calendar, MapPin, QrCode, CheckCircle2 } from "lucide-react";

export default function MyTicketsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-[#141d23]">
            Vé của tôi
          </h1>
          <p className="text-[14px] text-[#606970]">
            Quản lý các vé sự kiện bạn đã đặt trên TicketHub
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-primary text-white text-[13px] font-bold hover:bg-emerald-700 transition-colors self-start"
        >
          Đăng nhập để đồng bộ vé
        </Link>
      </div>

      {/* Boarding-Pass Style Event Ticket */}
      <div className="rounded-[16px] border border-[#dfe3e5] bg-white shadow-xs overflow-hidden max-w-3xl">
        <div className="p-6 sm:p-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-primary text-[12px] font-bold">
              <CheckCircle2 className="size-3.5" /> Vé hợp lệ • Đã xác nhận
            </span>
            <span className="text-[12px] font-mono text-[#606970]">
              MÃ ĐƠN #88412
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <img
              src="/images/events/vn/anh-trai.jpg"
              alt="Anh Trai Vượt Ngàn Chông Gai Concert"
              className="w-full sm:w-32 aspect-[16/10] object-cover rounded-[10px] bg-[#eff1f2] shrink-0"
            />
            <div className="space-y-1.5">
              <h2 className="text-[19px] sm:text-[21px] font-extrabold text-[#141d23]">
                Anh Trai Vượt Ngàn Chông Gai: Concert Day 3
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#606970] pt-0.5">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-4 text-primary" /> T7, 15 Th11, 2026
                  • 19:30
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-primary" /> Vạn Phúc City, TP.
                  Thủ Đức, TP.HCM
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 rounded-[12px] bg-[#f5f7f8] border border-[#dfe3e5] p-4">
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-[#606970] font-semibold">
                Khu vực
              </span>
              <span className="font-bold text-[15px] text-[#141d23]">
                VIP A
              </span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-[#606970] font-semibold">
                Hàng ghế
              </span>
              <span className="font-mono font-bold text-[15px] text-[#141d23]">
                HÀNG B
              </span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-[#606970] font-semibold">
                Số ghế
              </span>
              <span className="font-mono font-bold text-[15px] text-primary">
                B-14
              </span>
            </div>
          </div>
        </div>

        {/* Perforated Boarding-Pass Divider */}
        <div className="ticket-notch-horizontal border-t border-dashed border-[#dfe3e5]" />

        {/* Bottom QR Pass Bar */}
        <div className="px-6 sm:px-7 py-4 bg-[#f5f7f8]/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-[10px] bg-white border border-[#dfe3e5] flex items-center justify-center text-[#141d23] shrink-0">
              <QrCode className="size-6" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#141d23]">
                Vé điện tử vào cổng
              </p>
              <p className="text-[12px] text-[#606970]">
                Xuất trình mã QR trên ứng dụng tại cổng soát vé
              </p>
            </div>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-primary hover:bg-emerald-700 text-white text-[12px] font-bold transition-colors shrink-0"
          >
            Mở mã QR
          </Link>
        </div>
      </div>
    </div>
  );
}
