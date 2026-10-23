"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  ChevronRight,
  Ticket,
  Trash2,
  CheckCircle2,
  Timer,
  Building2,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import {
  EVENTS,
  getEventById,
  getEventSeatMap,
  formatVnd,
  type EventItem,
  type SeatItem,
  type EventZone,
} from "@/lib/events-catalog";
import { SeatMap } from "@/components/events/seat-map";

const MAX_TICKETS_PER_ORDER = 6;

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = typeof params?.id === "string" ? params.id : "";

  const event = useMemo(() => {
    return getEventById(eventId) ?? EVENTS[0];
  }, [eventId]);

  return <EventBookingView key={event.id} event={event} />;
}

function EventBookingView({ event }: { event: EventItem }) {
  const zones = useMemo(() => getEventSeatMap(event), [event]);

  const initialSelectedSeats = useMemo(() => {
    const firstSeated = zones.find((z) => z.isSeated && z.rows.length > 0);
    if (!firstSeated) return [];
    const availableInRowA =
      firstSeated.rows[0]?.seats.filter((s) => s.status === "AVAILABLE") ?? [];
    return availableInRowA.slice(0, 2);
  }, [zones]);

  const [selectedSeats, setSelectedSeats] =
    useState<SeatItem[]>(initialSelectedSeats);
  const [standingSelections, setStandingSelections] = useState<
    Record<string, number>
  >({});
  const [holdSecondsLeft, setHoldSecondsLeft] = useState<number | null>(null);
  const [holdOrderCode, setHoldOrderCode] = useState<string | null>(null);
  const [limitNotice, setLimitNotice] = useState<string | null>(null);

  // Live 5-minute countdown timer when seats are held
  useEffect(() => {
    if (holdSecondsLeft === null || holdSecondsLeft <= 0) return;
    const timer = setInterval(() => {
      setHoldSecondsLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [holdSecondsLeft]);

  const totalStandingCount = Object.values(standingSelections).reduce(
    (sum, qty) => sum + qty,
    0
  );
  const totalTicketCount = selectedSeats.length + totalStandingCount;

  const handleToggleSeat = (seat: SeatItem) => {
    if (seat.status !== "AVAILABLE") return;
    setLimitNotice(null);

    setSelectedSeats((prev) => {
      const exists = prev.some((s) => s.id === seat.id);
      if (exists) {
        return prev.filter((s) => s.id !== seat.id);
      }
      if (prev.length + totalStandingCount >= MAX_TICKETS_PER_ORDER) {
        setLimitNotice(
          `Mỗi đơn hàng chỉ được chọn tối đa ${MAX_TICKETS_PER_ORDER} vé.`
        );
        return prev;
      }
      return [...prev, seat];
    });
  };

  const handleChangeStandingQty = (zone: EventZone, delta: number) => {
    setLimitNotice(null);
    setStandingSelections((prev) => {
      const current = prev[zone.zoneId] ?? 0;
      const next = current + delta;
      if (next < 0) return prev;
      if (
        delta > 0 &&
        selectedSeats.length + totalStandingCount >= MAX_TICKETS_PER_ORDER
      ) {
        setLimitNotice(
          `Mỗi đơn hàng chỉ được chọn tối đa ${MAX_TICKETS_PER_ORDER} vé.`
        );
        return prev;
      }
      if (next === 0) {
        const copy = { ...prev };
        delete copy[zone.zoneId];
        return copy;
      }
      return { ...prev, [zone.zoneId]: next };
    });
  };

  const handleQuickPickZone = (zone: EventZone) => {
    setLimitNotice(null);
    if (!zone.isSeated) {
      handleChangeStandingQty(zone, 1);
      return;
    }

    if (totalTicketCount >= MAX_TICKETS_PER_ORDER) {
      setLimitNotice(
        `Mỗi đơn hàng chỉ được chọn tối đa ${MAX_TICKETS_PER_ORDER} vé.`
      );
      return;
    }

    const selectedIds = new Set(selectedSeats.map((s) => s.id));
    for (const row of zone.rows) {
      for (const seat of row.seats) {
        if (seat.status === "AVAILABLE" && !selectedIds.has(seat.id)) {
          setSelectedSeats((prev) => [...prev, seat]);
          return;
        }
      }
    }
  };

  const handleStartHold = () => {
    if (totalTicketCount === 0) return;
    setHoldSecondsLeft(300); // 5 minutes (300 seconds) matching backend Redis TTL
    setHoldOrderCode("ORD-88412");
  };

  const handleCancelHold = () => {
    setHoldSecondsLeft(null);
    setHoldOrderCode(null);
  };

  const seatsSubtotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const standingSubtotal = zones.reduce((sum, z) => {
    const qty = standingSelections[z.zoneId] ?? 0;
    return sum + qty * z.price;
  }, 0);
  const totalAmount = seatsSubtotal + standingSubtotal;

  const categoryLabel =
    event.category === "CONCERT"
      ? "Hòa nhạc"
      : event.category === "SPORT"
        ? "Thể thao"
        : event.category === "THEATER"
          ? "Sân khấu & Hài kịch"
          : "Lễ hội âm nhạc";

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="bg-background min-h-screen pb-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-4">
        {/* 1. Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground mb-4"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Trang chủ
          </Link>
          <ChevronRight className="size-3.5" />
          <span>{categoryLabel}</span>
          <ChevronRight className="size-3.5" />
          <span>{event.city}</span>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground font-semibold truncate max-w-[260px]">
            {event.title}
          </span>
        </nav>

        {/* 2. Event Header Card */}
        <section className="rounded-[16px] border border-border bg-background p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
              <div className="relative w-full sm:w-44 aspect-[5/4] rounded-[12px] overflow-hidden bg-secondary shrink-0">
                <img
                  src={event.image}
                  alt={event.title}
                  className="h-full w-full object-cover"
                />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-foreground/85 text-background text-[11px] font-bold">
                  {categoryLabel}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent text-accent-foreground text-[11px] font-bold">
                    <Sparkles className="size-3" /> Đang mở bán chính thức
                  </span>
                  <span className="text-[12px] text-muted-foreground">
                    Đơn vị tổ chức:{" "}
                    <strong className="text-foreground">
                      {event.organizerName}
                    </strong>
                  </span>
                </div>

                <h1 className="text-[22px] sm:text-[26px] font-extrabold tracking-[-0.02em] text-foreground leading-tight">
                  {event.title}
                </h1>

                <p className="text-[13px] text-muted-foreground max-w-2xl leading-relaxed">
                  {event.description}
                </p>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-1 text-[13px] text-foreground">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Calendar className="size-4 text-primary shrink-0" />
                    {event.fullDateTime}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="size-4 text-primary shrink-0" />
                    Mở cửa check-in: {event.doorsOpenTime}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <MapPin className="size-4 text-primary shrink-0" />
                    {event.venue} • {event.venueAddress}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Guarantee Badge */}
            <div className="lg:w-64 shrink-0 rounded-[12px] bg-muted/70 border border-border p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-primary font-bold text-[13px]">
                <ShieldCheck className="size-4.5 shrink-0" />
                <span>Bảo vệ người mua 100%</span>
              </div>
              <p className="text-[12px] text-muted-foreground leading-snug">
                Vé điện tử định danh mã QR độc quyền. Giữ ghế trực tiếp trong 5
                phút không lo trùng chỗ.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Two-Column Interactive SeatMap + Ticket Checkout Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Interactive SVG SeatMap + Zone Pricing Table */}
          <div className="lg:col-span-8 space-y-6">
            <SeatMap
              zones={zones}
              category={event.category}
              selectedSeats={selectedSeats}
              standingSelections={standingSelections}
              maxTicketsPerOrder={MAX_TICKETS_PER_ORDER}
              onToggleSeat={handleToggleSeat}
              onChangeStandingQty={handleChangeStandingQty}
            />

            {/* Zone Breakdown List */}
            <div className="rounded-[16px] border border-border bg-background p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[17px] font-bold text-foreground">
                    Danh sách các hạng vé &amp; khu vực
                  </h2>
                  <p className="text-[12px] text-muted-foreground">
                    Bạn có thể nhấn trực tiếp vào từng ghế trên sơ đồ hoặc chọn
                    nhanh hạng vé bên dưới
                  </p>
                </div>
                <Building2 className="size-5 text-muted-foreground" />
              </div>

              <div className="divide-y divide-border">
                {zones.map((zone) => {
                  const selectedInZone = zone.isSeated
                    ? selectedSeats.filter((s) => s.zoneId === zone.zoneId)
                        .length
                    : (standingSelections[zone.zoneId] ?? 0);

                  return (
                    <div
                      key={zone.zoneId}
                      className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-bold text-foreground">
                            {zone.zoneName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
                            {zone.isSeated ? "Ghế đánh số" : "Vé đứng tự do"}
                          </span>
                          {selectedInZone > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-accent text-primary">
                              Đã chọn {selectedInZone} vé
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-muted-foreground">
                          {zone.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                        <div className="text-left sm:text-right">
                          <div className="text-[14px] font-bold text-foreground">
                            {formatVnd(zone.price)}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Còn {zone.availableCount} chỗ trống
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleQuickPickZone(zone)}
                          disabled={totalTicketCount >= MAX_TICKETS_PER_ORDER}
                          className="h-9 px-3.5 rounded-[8px] border border-border bg-background hover:border-primary hover:text-primary text-[12px] font-semibold text-foreground transition-colors disabled:opacity-40"
                        >
                          {zone.isSeated ? "+ Chọn ghế trống" : "+ Thêm 1 vé"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Sticky Selection Summary & 5-Minute Hold Checkout */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
            <div className="rounded-[16px] border border-border bg-background p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3.5">
                <div className="flex items-center gap-2">
                  <Ticket className="size-4.5 text-primary" />
                  <h2 className="text-[17px] font-bold text-foreground">
                    Vé đang chọn ({totalTicketCount})
                  </h2>
                </div>
                {totalTicketCount > 0 && !holdSecondsLeft && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSeats([]);
                      setStandingSelections({});
                      setLimitNotice(null);
                    }}
                    className="text-[12px] font-medium text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {limitNotice && (
                <div className="rounded-[10px] bg-destructive/10 border border-destructive/20 px-3.5 py-2.5 text-[12px] font-medium text-destructive">
                  {limitNotice}
                </div>
              )}

              {/* Active 5-Minute Hold Banner */}
              {holdSecondsLeft !== null && holdSecondsLeft > 0 && (
                <div className="rounded-[12px] bg-accent border border-primary/30 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-accent-foreground">
                      <Timer className="size-4 text-primary" />
                      Đang giữ chỗ • Mã {holdOrderCode}
                    </span>
                    <span className="font-mono text-[15px] font-extrabold text-primary">
                      {formatCountdown(holdSecondsLeft)}
                    </span>
                  </div>
                  <p className="text-[12px] text-accent-foreground/90 leading-snug">
                    Hệ thống đã khóa tạm thời các ghế của bạn trong 5 phút. Vui
                    lòng hoàn tất thanh toán trước khi hết giờ.
                  </p>
                </div>
              )}

              {/* Selected Seats & Standing Tickets List */}
              {totalTicketCount === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-[14px] font-semibold text-foreground">
                    Chưa có ghế nào được chọn
                  </p>
                  <p className="text-[12px] text-muted-foreground max-w-[240px] mx-auto">
                    Nhấn vào các ô ghế màu trắng trên sơ đồ bên trái để chọn vị
                    trí ngồi ưng ý.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
                  {selectedSeats.map((seat) => (
                    <div
                      key={seat.id}
                      className="rounded-[10px] border border-border bg-muted/50 px-3.5 py-2.5 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="text-[13px] font-bold text-foreground">
                          {seat.zoneName}
                        </div>
                        <div className="text-[12px] font-mono text-muted-foreground">
                          Hàng {seat.rowLabel} • Ghế {seat.rowLabel}-
                          {seat.seatNumber}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="text-[13px] font-bold text-foreground">
                          {formatVnd(seat.price)}
                        </span>
                        {!holdSecondsLeft && (
                          <button
                            type="button"
                            onClick={() => handleToggleSeat(seat)}
                            aria-label={`Bỏ chọn ghế ${seat.rowLabel}-${seat.seatNumber}`}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {zones.map((zone) => {
                    const qty = standingSelections[zone.zoneId] ?? 0;
                    if (qty <= 0) return null;
                    return (
                      <div
                        key={zone.zoneId}
                        className="rounded-[10px] border border-border bg-muted/50 px-3.5 py-2.5 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="text-[13px] font-bold text-foreground">
                            {zone.zoneName}
                          </div>
                          <div className="text-[12px] text-muted-foreground">
                            Số lượng: <strong className="font-mono">{qty}</strong>{" "}
                            vé đứng
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="text-[13px] font-bold text-foreground">
                            {formatVnd(zone.price * qty)}
                          </span>
                          {!holdSecondsLeft && (
                            <button
                              type="button"
                              onClick={() =>
                                handleChangeStandingQty(zone, -qty)
                              }
                              aria-label={`Xóa vé ${zone.zoneName}`}
                              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Price Summary */}
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                  <span>Tạm tính ({totalTicketCount} vé)</span>
                  <span className="font-medium text-foreground">
                    {formatVnd(totalAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                  <span>Phí dịch vụ đặt vé</span>
                  <span className="font-semibold text-primary">Miễn phí</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-[14px] font-bold text-foreground">
                    Tổng thanh toán
                  </span>
                  <span className="text-[20px] font-extrabold text-foreground">
                    {formatVnd(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {holdSecondsLeft !== null && holdSecondsLeft > 0 ? (
                <div className="space-y-2.5">
                  <Link
                    href={`/my-tickets?event=${event.id}&order=${holdOrderCode}`}
                    className="w-full h-11 rounded-[10px] bg-primary hover:bg-emerald-700 text-primary-foreground text-[14px] font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle2 className="size-4.5" />
                    Thanh toán VNPay &amp; Nhận vé QR
                  </Link>
                  <button
                    type="button"
                    onClick={handleCancelHold}
                    className="w-full h-9 rounded-[8px] border border-border bg-background hover:bg-muted text-[12px] font-semibold text-muted-foreground transition-colors"
                  >
                    Hủy giữ chỗ &amp; chọn lại ghế
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={totalTicketCount === 0}
                  onClick={handleStartHold}
                  className="w-full h-11 rounded-[10px] bg-primary hover:bg-emerald-700 disabled:opacity-45 text-primary-foreground text-[14px] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  Giữ chỗ ngay (5 phút)
                </button>
              )}

              <p className="text-[11px] text-center text-muted-foreground">
                Bằng việc tiếp tục, bạn đồng ý với Điều khoản mua vé và Chính
                sách hoàn tiền của TicketHub.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
