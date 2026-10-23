"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Calendar, MapPin, QrCode, CheckCircle2, Ticket } from "lucide-react";
import { EVENTS, getEventById } from "@/lib/events-catalog";

function MyTicketsContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event") ?? "";
  const orderCode = searchParams.get("order") ?? "ORD-88412";

  const activeEvent = getEventById(eventId) ?? EVENTS[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-foreground">
            Vé của tôi
          </h1>
          <p className="text-[14px] text-muted-foreground">
            Quản lý các vé sự kiện điện tử bạn đã đặt trên TicketHub
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start">
          <Link
            href={`/events/${activeEvent.id}`}
            className="inline-flex items-center gap-1.5 justify-center h-10 px-4 rounded-full border border-border bg-background text-foreground text-[13px] font-semibold hover:border-primary hover:text-primary transition-colors"
          >
            <Ticket className="size-4 text-primary" />
            Xem sơ đồ ghế
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-primary text-primary-foreground text-[13px] font-bold hover:bg-emerald-700 transition-colors"
          >
            Đăng nhập để đồng bộ vé
          </Link>
        </div>
      </div>

      {/* Boarding-Pass Style Event Ticket */}
      <div className="rounded-[16px] border border-border bg-background shadow-xs overflow-hidden max-w-3xl">
        <div className="p-6 sm:p-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-primary text-[12px] font-bold">
              <CheckCircle2 className="size-3.5" /> Vé hợp lệ • Đã xác nhận
            </span>
            <span className="text-[12px] font-mono text-muted-foreground">
              MÃ ĐƠN #{orderCode}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <img
              src={activeEvent.image}
              alt={activeEvent.title}
              className="w-full sm:w-32 aspect-[16/10] object-cover rounded-[10px] bg-secondary shrink-0"
            />
            <div className="space-y-1.5">
              <h2 className="text-[19px] sm:text-[21px] font-extrabold text-foreground">
                {activeEvent.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-[13px] text-muted-foreground pt-0.5">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-4 text-primary" />{" "}
                  {activeEvent.fullDateTime}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-primary" /> {activeEvent.venue}
                  , {activeEvent.city}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 rounded-[12px] bg-muted border border-border p-4">
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Khu vực
              </span>
              <span className="font-bold text-[15px] text-foreground">
                VIP A
              </span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Hàng ghế
              </span>
              <span className="font-mono font-bold text-[15px] text-foreground">
                HÀNG A
              </span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Số ghế
              </span>
              <span className="font-mono font-bold text-[15px] text-primary">
                A-01, A-02
              </span>
            </div>
          </div>
        </div>

        {/* Perforated Boarding-Pass Divider */}
        <div className="ticket-notch-horizontal border-t border-dashed border-border" />

        {/* Bottom QR Pass Bar */}
        <div className="px-6 sm:px-7 py-4 bg-muted/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-[10px] bg-background border border-border flex items-center justify-center text-foreground shrink-0">
              <QrCode className="size-6" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-foreground">
                Vé điện tử vào cổng
              </p>
              <p className="text-[12px] text-muted-foreground">
                Xuất trình mã QR trên ứng dụng tại cổng soát vé{" "}
                {activeEvent.venue}
              </p>
            </div>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-primary hover:bg-emerald-700 text-primary-foreground text-[12px] font-bold transition-colors shrink-0"
          >
            Mở mã QR
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MyTicketsPage() {
  return (
    <Suspense fallback={<div className="py-12 text-sm text-muted-foreground">Đang tải vé...</div>}>
      <MyTicketsContent />
    </Suspense>
  );
}
