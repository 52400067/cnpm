"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarPlus,
  MapPin,
  Calendar,
  ExternalLink,
  Ticket,
  Clock,
  ShieldCheck,
  Building2,
  Layers,
  Search,
} from "lucide-react";
import { EVENTS, getEventVenueMapKey } from "@/lib/events-catalog";
import { CURATED_VENUES, type VietnamCity } from "@/lib/curated-venues";

const VENUE_TEMPLATE_LABELS: Record<string, string> = {
  "arena-t-stage": "Sân khấu chữ T (Nhà thi đấu)",
  "stadium-concert": "SVĐ Mega Concert",
  "stadium-football": "Sân bóng đá chuẩn FIFA",
  "arena-basketball": "Sàn đấu bóng rổ / VBA",
  theater: "Khán phòng Nhà hát",
};

const CITY_TABS: Array<{ id: VietnamCity | "ALL"; label: string }> = [
  { id: "ALL", label: "Tất cả thành phố" },
  { id: "TP. Hồ Chí Minh", label: "TP. Hồ Chí Minh" },
  { id: "Hà Nội", label: "Hà Nội" },
  { id: "Đà Nẵng", label: "Đà Nẵng" },
];

export default function OrganizerEventsPage() {
  const [selectedCity, setSelectedCity] = useState<VietnamCity | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = useMemo(() => {
    return EVENTS.filter((event) => {
      const matchCity = selectedCity === "ALL" || event.city === selectedCity;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        q === "" ||
        event.title.toLowerCase().includes(q) ||
        event.venue.toLowerCase().includes(q) ||
        event.city.toLowerCase().includes(q);
      return matchCity && matchSearch;
    });
  }, [selectedCity, searchQuery]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-7 space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[12px] font-bold text-primary">
            <span>Cổng quản trị Ban Tổ Chức</span>
            <span>•</span>
            <span>3 Thành phố trọng điểm</span>
          </div>
          <h1 className="text-[24px] sm:text-[26px] font-extrabold tracking-[-0.02em] text-[#141d23]">
            Quản lý sự kiện &amp; Sơ đồ khán đài
          </h1>
          <p className="text-[13.5px] text-[#606970]">
            Theo dõi các sự kiện đang mở bán, mẫu sơ đồ kiến trúc SVG và cấu hình phân khu vé trực tiếp.
          </p>
        </div>
        <Link
          href="/organizer/events/new"
          className="inline-flex items-center gap-2 px-5 h-10 rounded-full bg-primary hover:bg-emerald-700 text-white text-[13px] font-bold shadow-2xs transition-colors self-start sm:self-auto shrink-0"
        >
          <CalendarPlus className="size-4" />
          <span>Tạo sự kiện &amp; Chọn sơ đồ mới</span>
        </Link>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4.5 rounded-[12px] border border-[#dfe3e5] space-y-1.5">
          <div className="flex items-center justify-between text-[#606970] text-[12.5px] font-medium">
            <span>Sự kiện đang mở bán</span>
            <span className="size-7 rounded-full bg-emerald-50 text-primary flex items-center justify-center">
              <Ticket className="size-3.5" />
            </span>
          </div>
          <div className="text-[26px] font-extrabold tracking-tight text-[#141d23]">
            {EVENTS.length}
          </div>
          <p className="text-[12px] text-[#065f46] font-semibold">
            100% tích hợp sơ đồ SVG trực tiếp
          </p>
        </div>

        <div className="bg-white p-4.5 rounded-[12px] border border-[#dfe3e5] space-y-1.5">
          <div className="flex items-center justify-between text-[#606970] text-[12.5px] font-medium">
            <span>Địa điểm chuẩn (Curated)</span>
            <span className="size-7 rounded-full bg-emerald-50 text-primary flex items-center justify-center">
              <Building2 className="size-3.5" />
            </span>
          </div>
          <div className="text-[26px] font-extrabold tracking-tight text-[#141d23]">
            {CURATED_VENUES.length}
          </div>
          <p className="text-[12px] text-[#606970]">
            TP. Hồ Chí Minh (4) • Hà Nội (4) • Đà Nẵng (3)
          </p>
        </div>

        <div className="bg-white p-4.5 rounded-[12px] border border-[#dfe3e5] space-y-1.5">
          <div className="flex items-center justify-between text-[#606970] text-[12.5px] font-medium">
            <span>Mô hình khán đài SVG</span>
            <span className="size-7 rounded-full bg-emerald-50 text-primary flex items-center justify-center">
              <Layers className="size-3.5" />
            </span>
          </div>
          <div className="text-[26px] font-extrabold tracking-tight text-[#141d23]">
            5
          </div>
          <p className="text-[12px] text-[#606970]">
            T-Stage, Mega Concert, FIFA, VBA, Nhà hát
          </p>
        </div>

        <div className="bg-white p-4.5 rounded-[12px] border border-[#dfe3e5] space-y-1.5">
          <div className="flex items-center justify-between text-[#606970] text-[12.5px] font-medium">
            <span>Giữ chỗ &amp; Chống vé giả</span>
            <span className="size-7 rounded-full bg-emerald-50 text-primary flex items-center justify-center">
              <ShieldCheck className="size-3.5" />
            </span>
          </div>
          <div className="text-[26px] font-extrabold tracking-tight text-[#141d23]">
            5 phút
          </div>
          <p className="text-[12px] text-[#065f46] font-semibold flex items-center gap-1">
            <Clock className="size-3.5" /> Khóa ghế nguyên tử &amp; QR động
          </p>
        </div>
      </div>

      {/* Events Directory Card */}
      <div className="bg-white rounded-[12px] border border-[#dfe3e5] overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 sm:px-6 border-b border-[#dfe3e5] flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          {/* City Pill Filters matching Home & Event pages */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {CITY_TABS.map((tab) => {
              const active = selectedCity === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCity(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-bold whitespace-nowrap transition-colors ${
                    active
                      ? "bg-[#141d23] text-white"
                      : "bg-[#eff1f2] text-[#141d23] hover:bg-[#dfe3e5]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="size-4 text-[#606970] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên sự kiện, sân vận động..."
              className="w-full h-9 pl-9 pr-3.5 rounded-full border border-[#dfe3e5] bg-[#f5f7f8] focus:bg-white text-[12.5px] text-[#141d23] placeholder:text-[#606970] focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f5f7f8] text-[11.5px] uppercase tracking-wider text-[#606970] font-bold border-b border-[#dfe3e5]">
                <th className="py-3 px-6">Sự kiện &amp; Lịch diễn</th>
                <th className="py-3 px-6">Địa điểm &amp; Thành phố</th>
                <th className="py-3 px-6">Mẫu sơ đồ SVG</th>
                <th className="py-3 px-6">Giá vé từ</th>
                <th className="py-3 px-6">Trạng thái</th>
                <th className="py-3 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dfe3e5] text-[13px]">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#606970]">
                    Không tìm thấy sự kiện nào khớp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => {
                  const mapKey = getEventVenueMapKey(event);
                  const templateLabel = VENUE_TEMPLATE_LABELS[mapKey] || "Sơ đồ kiến trúc";

                  return (
                    <tr key={event.id} className="hover:bg-[#f5f7f8]/70 transition-colors">
                      {/* Event Title & Thumbnail */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative w-15 h-10 rounded-[8px] overflow-hidden bg-[#eff1f2] shrink-0 border border-[#dfe3e5]">
                            <Image
                              src={event.image}
                              alt={event.title}
                              fill
                              className="object-cover"
                              sizes="60px"
                            />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/events/${event.id}`}
                              className="font-bold text-[#141d23] hover:text-primary transition-colors line-clamp-1"
                            >
                              {event.title}
                            </Link>
                            <div className="flex items-center gap-1.5 text-[12px] text-[#606970] mt-0.5">
                              <Calendar className="size-3.5 text-primary shrink-0" />
                              <span>{event.fullDateTime}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Venue & City */}
                      <td className="py-3.5 px-6 text-[#141d23]">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-[#606970] shrink-0" />
                          <span className="font-semibold">{event.venue}</span>
                        </div>
                        <span className="text-[12px] text-[#606970] pl-5">{event.city}</span>
                      </td>

                      {/* Venue Template */}
                      <td className="py-3.5 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#eff1f2] text-[#141d23] text-[12px] font-semibold">
                          {templateLabel}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-6 font-extrabold text-[#141d23]">
                        {event.fromPrice}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-6">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-emerald-50 text-[#065f46] border border-emerald-200">
                          ● Đang mở bán
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-6 text-right">
                        <Link
                          href={`/events/${event.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#dfe3e5] hover:border-primary hover:text-primary text-[12px] font-bold text-[#141d23] transition-colors"
                        >
                          <ExternalLink className="size-3.5" />
                          <span>Xem sơ đồ ghế</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
