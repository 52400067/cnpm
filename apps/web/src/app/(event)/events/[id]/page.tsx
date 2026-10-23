"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Heart,
  ArrowLeft,
  Calendar,
  MapPin,
  Flame,
  SlidersHorizontal,
  ChevronDown,
  X,
  CheckCircle2,
  Timer,
  Eye,
  ShieldCheck,
  User,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import {
  EVENTS,
  getEventById,
  getEventVenueMapKey,
  getEventListings,
  formatVnd,
  type EventItem,
  type TicketListing,
} from "@/lib/events-catalog";
import { SeatMap } from "@/components/events/seat-map";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = typeof params?.id === "string" ? params.id : "";

  const event = useMemo(() => {
    return getEventById(eventId) ?? EVENTS[0];
  }, [eventId]);

  return <EventSplitView key={event.id} event={event} />;
}

function EventSplitView({ event }: { event: EventItem }) {
  const mapKey = useMemo(() => getEventVenueMapKey(event), [event]);
  const allListings = useMemo(() => getEventListings(event), [event]);

  // Selected filters & state
  const [ticketQuantity, setTicketQuantity] = useState<number>(2);
  const [showQtyModal, setShowQtyModal] = useState<boolean>(false);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<TicketListing | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // 5-minute Hold countdown
  const [holdSecondsLeft, setHoldSecondsLeft] = useState<number | null>(null);
  const [holdOrderCode, setHoldOrderCode] = useState<string | null>(null);

  useEffect(() => {
    if (holdSecondsLeft === null || holdSecondsLeft <= 0) return;
    const timer = setInterval(() => {
      setHoldSecondsLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [holdSecondsLeft]);

  // Filter listings based on activeZoneId and ticketQuantity
  const filteredListings = useMemo(() => {
    return allListings.filter((l) => {
      if (activeZoneId && l.zoneId !== activeZoneId) {
        return false;
      }
      if (l.availableTickets < ticketQuantity) {
        return false;
      }
      return true;
    });
  }, [allListings, activeZoneId, ticketQuantity]);

  // Map of zone information for map tooltips
  const zoneInfoMap = useMemo(() => {
    const map: Record<string, { name: string; minPrice: number; count: number }> = {};
    for (const l of allListings) {
      if (!map[l.zoneId] || l.price < map[l.zoneId].minPrice) {
        map[l.zoneId] = {
          name: l.zoneName,
          minPrice: l.price,
          count: (map[l.zoneId]?.count ?? 0) + l.availableTickets,
        };
      }
    }
    return map;
  }, [allListings]);

  const handleStartHold = (listing: TicketListing) => {
    setSelectedListing(listing);
    setHoldSecondsLeft(300); // 5 minutes
    const orderNum = (listing.price % 89999) + 10000;
    setHoldOrderCode(`ORD-${orderNum}`);
  };

  const handleCancelHold = () => {
    setHoldSecondsLeft(null);
    setHoldOrderCode(null);
    setSelectedListing(null);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-32px)] bg-white overflow-hidden text-[#141d23]">
      {/* 1. Compact Event Header Bar */}
      <header className="h-[64px] border-b border-[#dfe3e5] bg-white px-3 sm:px-6 flex items-center justify-between gap-3 sm:gap-4 shrink-0 z-30">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Logo className="hidden md:inline-flex mr-1" />

          <Link
            href="/"
            aria-label="Quay lại danh sách sự kiện"
            className="size-9 rounded-full border border-[#dfe3e5] flex items-center justify-center text-[#141d23] hover:bg-[#f5f7f8] transition-colors shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Link>

          <img
            src={event.image}
            alt={event.title}
            className="size-11 rounded-[8px] object-cover bg-[#eff1f2] shrink-0 border border-[#dfe3e5]"
          />

          <div className="min-w-0">
            <h1 className="text-[14px] sm:text-[16px] font-bold text-[#141d23] truncate leading-tight">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2.5 text-[11.5px] sm:text-[12px] text-[#606970] truncate">
              <span className="inline-flex items-center gap-1 font-semibold text-[#141d23]">
                <Calendar className="size-3.5 text-primary shrink-0" />
                {event.fullDateTime}
              </span>
              <span className="hidden sm:inline text-[#dfe3e5]">•</span>
              <span className="hidden sm:inline-flex items-center gap-1 truncate">
                <MapPin className="size-3.5 text-primary shrink-0" />
                {event.venue}, {event.city}
              </span>
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsSaved(!isSaved)}
            aria-label={isSaved ? "Bỏ lưu sự kiện" : "Lưu vào yêu thích"}
            className="size-9 rounded-full border border-[#dfe3e5] flex items-center justify-center text-[#141d23] hover:bg-[#f5f7f8] transition-colors"
          >
            <Heart
              className={`size-4 ${
                isSaved ? "fill-primary text-primary" : "text-[#141d23]"
              }`}
            />
          </button>

          <Link
            href="/my-tickets"
            className="hidden md:inline-flex items-center text-[13px] font-medium text-[#141d23] hover:text-primary transition-colors px-2 py-1"
          >
            Vé của tôi
          </Link>

          <Link
            href="/login"
            aria-label="Tài khoản"
            className="size-8 rounded-full bg-[#eff1f2] hover:bg-emerald-50 hover:text-primary flex items-center justify-center text-[#141d23] transition-colors"
          >
            <User className="size-4 fill-current" />
          </Link>
        </div>
      </header>

      {/* 2. Slim Urgency / Social Proof Banner */}
      <div className="h-[34px] bg-[#fdf2f4] border-b border-[#fcd5dc] px-4 flex items-center justify-center gap-2 text-[12px] text-[#9f1239] font-semibold shrink-0">
        <Flame className="size-3.5 text-[#e11d48]" />
        <span>Sắp hết vé! Hơn 70 người đang xem sự kiện này trong 1 giờ qua</span>
      </div>

      {/* 3. Full-Height Split Screen Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* LEFT PANE: Interactive Architectural Stadium/Arena SVG Map */}
        <div className="w-full lg:w-[58%] xl:w-[62%] h-[42vh] lg:h-full relative border-b lg:border-b-0 lg:border-r border-[#dfe3e5] bg-[#f8fafc] flex flex-col">
          {/* Active section filter badge if selected */}
          {activeZoneId && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white px-3 py-1.5 rounded-[8px] border border-[#dfe3e5] shadow-xs text-[12px]">
              <span className="text-[#606970]">Đang lọc:</span>
              <strong className="text-primary font-bold">
                {zoneInfoMap[activeZoneId]?.name || activeZoneId}
              </strong>
              <button
                type="button"
                onClick={() => setActiveZoneId(null)}
                aria-label="Xóa bộ lọc khu vực"
                className="size-5 rounded-full hover:bg-[#eff1f2] flex items-center justify-center text-[#606970]"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {/* SeatMap Canvas */}
          <div className="flex-1 w-full h-full">
            <SeatMap
              mapKey={mapKey}
              activeZoneId={activeZoneId}
              hoveredZoneId={hoveredZoneId}
              zoneInfoMap={zoneInfoMap}
              onSelectZone={(zid) => setActiveZoneId(zid)}
              onHoverZone={(zid) => setHoveredZoneId(zid)}
            />
          </div>
        </div>

        {/* RIGHT PANE: Filter Bar + Scrollable Ticket Listings */}
        <div className="w-full lg:w-[42%] xl:w-[38%] h-[58vh] lg:h-full flex flex-col bg-white overflow-hidden">
          {/* Top Filter Bar inside right pane */}
          <div className="p-3.5 border-b border-[#dfe3e5] bg-white flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="size-9 rounded-[8px] border border-[#dfe3e5] hover:border-[#868f97] flex items-center justify-center text-[#141d23] transition-colors"
                aria-label="Bộ lọc tìm kiếm vé"
              >
                <SlidersHorizontal className="size-4" />
              </button>

              {/* Ticket Quantity Dropdown Button */}
              <button
                type="button"
                onClick={() => setShowQtyModal(true)}
                className="h-9 px-3.5 rounded-[8px] border border-[#dfe3e5] hover:border-[#868f97] text-[13px] font-semibold text-[#141d23] flex items-center gap-2 transition-colors"
              >
                <span>{ticketQuantity} vé</span>
                <ChevronDown className="size-3.5 text-[#606970]" />
              </button>
            </div>

            <div className="text-[12px] text-[#606970] font-medium">
              Tìm thấy <strong className="text-[#141d23]">{filteredListings.length}</strong> hạng vé
            </div>
          </div>

          {/* Scrollable Ticket Listings */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#dfe3e5]">
            {filteredListings.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-[14px] font-semibold text-[#141d23]">
                  Không tìm thấy vé phù hợp cho khu vực đã chọn
                </p>
                <button
                  type="button"
                  onClick={() => setActiveZoneId(null)}
                  className="px-4 py-2 rounded-[8px] bg-primary text-white text-[13px] font-bold hover:bg-emerald-700 transition-colors"
                >
                  Xem tất cả các khu vực
                </button>
              </div>
            ) : (
              filteredListings.map((listing) => {
                const isHovered = hoveredZoneId === listing.zoneId;
                const isSelected = selectedListing?.id === listing.id;

                return (
                  <div
                    key={listing.id}
                    onMouseEnter={() => setHoveredZoneId(listing.zoneId)}
                    onMouseLeave={() => setHoveredZoneId(null)}
                    onClick={() => handleStartHold(listing)}
                    className={`p-4 transition-colors cursor-pointer flex gap-3.5 sm:gap-4 items-start ${
                      isSelected
                        ? "bg-emerald-50/70 border-l-4 border-l-primary"
                        : isHovered
                        ? "bg-[#f8fafc]"
                        : "hover:bg-[#f8fafc]"
                    }`}
                  >
                    {/* Left: 3D View-From-Seat Stage Photo */}
                    <div className="w-[124px] sm:w-[140px] aspect-[16/10] rounded-[8px] overflow-hidden bg-[#141d23] shrink-0 relative border border-[#dfe3e5]">
                      <img
                        src={listing.viewFromSeatUrl}
                        alt={`Góc nhìn từ ${listing.section}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-[4px] bg-black/70 text-white text-[10px] flex items-center gap-1 font-semibold">
                        <Eye className="size-2.5" /> Góc nhìn
                      </span>
                    </div>

                    {/* Middle: Details & Features */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="text-[14px] font-bold text-[#141d23] leading-snug">
                          {listing.section}
                        </h2>
                        {listing.isLastTickets && (
                          <span className="px-1.5 py-0.5 rounded-[4px] bg-[#fce8ec] text-[#b42336] text-[10px] font-bold whitespace-nowrap">
                            Sắp hết vé
                          </span>
                        )}
                      </div>

                      {listing.row && (
                        <p className="text-[12px] font-mono text-[#606970]">
                          {listing.row}
                        </p>
                      )}

                      <div className="space-y-0.5 pt-0.5">
                        {listing.features.map((feat, idx) => (
                          <p
                            key={idx}
                            className="text-[11.5px] text-[#606970] truncate flex items-center gap-1"
                          >
                            <span>•</span>
                            <span>{feat}</span>
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Right: Price & Deal Score Badge */}
                    <div className="text-right shrink-0 flex flex-col items-end">
                      <div className="text-[16px] font-extrabold text-[#141d23] leading-tight">
                        {formatVnd(listing.price)}
                      </div>
                      {listing.originalPrice && (
                        <div className="text-[11px] text-[#606970] line-through">
                          {formatVnd(listing.originalPrice)}
                        </div>
                      )}
                      <div className="text-[11px] text-[#606970] mt-0.5">mỗi vé</div>

                      {/* Deal Score Badge */}
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-emerald-50 text-primary border border-emerald-200">
                        <span className="size-4.5 rounded-[4px] bg-primary text-white text-[10.5px] font-bold flex items-center justify-center">
                          {listing.dealScore}
                        </span>
                        <span className="text-[11px] font-bold text-primary">
                          {listing.dealLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. "How Many Tickets?" Modal */}
      {showQtyModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-white rounded-[16px] shadow-2xl p-6 sm:p-7 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-1.5">
              <h2 className="text-[20px] font-bold text-[#141d23]">
                Bạn cần mua bao nhiêu vé?
              </h2>
              <p className="text-[13px] text-[#606970] flex items-center justify-center gap-1.5">
                <CheckCircle2 className="size-4 text-primary" />
                Các ghế ngồi sẽ được xếp cạnh nhau
              </p>
            </div>

            {/* 2x2 Ticket Quantity Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((qty) => {
                const isSelected = ticketQuantity === qty;
                return (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setTicketQuantity(qty)}
                    className={`h-13 rounded-[12px] border text-[17px] font-bold transition-all ${
                      isSelected
                        ? "border-primary bg-emerald-50/50 text-primary ring-2 ring-primary/20"
                        : "border-[#dfe3e5] bg-white text-[#141d23] hover:border-[#868f97]"
                    }`}
                  >
                    {qty}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowQtyModal(false)}
              className="w-full h-11 rounded-[10px] bg-primary hover:bg-emerald-700 text-white font-bold text-[14px] transition-colors"
            >
              Tiếp tục
            </button>
          </div>
        </div>
      )}

      {/* 5. Selected Ticket & 5-Minute Hold Checkout Drawer */}
      {selectedListing && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg bg-white rounded-t-[20px] sm:rounded-[16px] shadow-2xl p-5 sm:p-6 space-y-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-[#dfe3e5] pb-3.5">
              <div>
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                  Xác nhận đặt vé
                </span>
                <h2 className="text-[18px] font-extrabold text-[#141d23]">
                  {selectedListing.section}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCancelHold}
                aria-label="Đóng cửa sổ đặt vé"
                className="size-8 rounded-full hover:bg-[#eff1f2] flex items-center justify-center text-[#606970]"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* 5-Minute Hold Notice Banner */}
            {holdSecondsLeft !== null && holdSecondsLeft > 0 && (
              <div className="rounded-[10px] bg-emerald-50 border border-emerald-200 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-bold text-[13px]">
                  <Timer className="size-4.5" />
                  <span>Đang giữ chỗ • Mã {holdOrderCode}</span>
                </div>
                <span className="font-mono text-[16px] font-extrabold text-primary">
                  {formatCountdown(holdSecondsLeft)}
                </span>
              </div>
            )}

            {/* View From Seat preview */}
            <div className="rounded-[10px] overflow-hidden border border-[#dfe3e5] bg-[#141d23] aspect-[16/9] relative">
              <img
                src={selectedListing.viewFromSeatUrl}
                alt="Góc nhìn thực tế từ chỗ ngồi"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 px-2 py-1 rounded-[6px] bg-black/75 text-white text-[11px] font-semibold">
                Góc nhìn thực tế sân khấu từ {selectedListing.section}
              </span>
            </div>

            {/* Ticket details summary */}
            <div className="bg-[#f8fafc] rounded-[10px] border border-[#dfe3e5] p-3.5 space-y-2 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-[#606970]">Khu vực &amp; Vị trí:</span>
                <span className="font-bold text-[#141d23]">
                  {selectedListing.zoneName} {selectedListing.row ? `• ${selectedListing.row}` : ""}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#606970]">Số lượng vé:</span>
                <span className="font-bold text-[#141d23]">{ticketQuantity} vé</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#606970]">Đơn giá:</span>
                <span className="font-semibold text-[#141d23]">
                  {formatVnd(selectedListing.price)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-[#dfe3e5] pt-2">
                <span className="font-bold text-[#141d23]">Tổng cộng:</span>
                <span className="text-[18px] font-extrabold text-primary">
                  {formatVnd(selectedListing.price * ticketQuantity)}
                </span>
              </div>
            </div>

            {/* Buyer Protection Guarantee */}
            <div className="flex items-center gap-2 text-[12px] text-[#606970]">
              <ShieldCheck className="size-4 text-primary shrink-0" />
              <span>Cam kết vé chính thức 100% • Quét mã QR vào cổng</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <Link
                href={`/my-tickets?event=${event.id}&order=${holdOrderCode || "ORD-88412"}&zone=${encodeURIComponent(selectedListing.zoneName)}&row=${encodeURIComponent(selectedListing.row || "")}&qty=${ticketQuantity}&price=${selectedListing.price}`}
                className="w-full h-11 rounded-[10px] bg-primary hover:bg-emerald-700 text-white text-[14px] font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle2 className="size-4.5" />
                Thanh toán qua VNPay &amp; Nhận vé QR
              </Link>
              <button
                type="button"
                onClick={handleCancelHold}
                className="w-full h-9 rounded-[8px] border border-[#dfe3e5] bg-white hover:bg-[#f5f7f8] text-[12px] font-semibold text-[#606970] transition-colors"
              >
                Hủy giữ chỗ &amp; chọn khu vực khác
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
