// apps/web/src/app/(public)/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Heart,
  MapPin,
  Calendar,
  ChevronRight,
  ChevronDown,
  Navigation,
  Sparkles,
  ShieldCheck,
  QrCode,
} from "lucide-react";

interface EventItem {
  id: string;
  slug: string;
  title: string;
  dateRange: string;
  city: string;
  venue: string;
  category: "CONCERT" | "SPORT" | "THEATER" | "FESTIVAL";
  minPrice: number;
  imageUrl: string;
}

const POPULAR_EVENTS: EventItem[] = [
  {
    id: "e1",
    slug: "anh-trai-vuot-ngan-chong-gai-concert-2026",
    title: "Anh Trai Vượt Ngàn Chông Gai Concert",
    dateRange: "24 Th10 - 15 Th11, 2026",
    city: "TP. Hồ Chí Minh",
    venue: "Vạn Phúc City",
    category: "CONCERT",
    minPrice: 800000,
    imageUrl:
      "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "e2",
    slug: "dem-nhac-mua-thu-ha-noi-2026",
    title: "Liveshow Âm Nhạc Mùa Thu Hà Nội",
    dateRange: "02 Th11 - 20 Th12, 2026",
    city: "Hà Nội",
    venue: "Trung tâm Hội nghị Quốc gia",
    category: "CONCERT",
    minPrice: 600000,
    imageUrl:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "e3",
    slug: "vba-finals-championship-2026",
    title: "Chung Kết Bóng Rổ VBA 2026",
    dateRange: "18 Th10 - 31 Th10, 2026",
    city: "TP. Hồ Chí Minh",
    venue: "Nhà thi đấu Hồ Xuân Hương",
    category: "SPORT",
    minPrice: 350000,
    imageUrl:
      "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "e4",
    slug: "le-hoi-am-nhac-quoc-te-hozo-2026",
    title: "HOZO Super Fest 2026",
    dateRange: "11 Th12 - 13 Th12, 2026",
    city: "TP. Hồ Chí Minh",
    venue: "Phố đi bộ Nguyễn Huệ",
    category: "FESTIVAL",
    minPrice: 500000,
    imageUrl:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=80",
  },
];

const CATEGORIES = [
  { key: "ALL", label: "Tất cả thể loại" },
  { key: "SPORT", label: "Thể thao" },
  { key: "CONCERT", label: "Hòa nhạc" },
  { key: "THEATER", label: "Sân khấu & Hài kịch" },
  { key: "FESTIVAL", label: "Lễ hội" },
] as const;

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("TP. Hồ Chí Minh");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredEvents = POPULAR_EVENTS.filter((ev) => {
    const matchesCategory =
      selectedCategory === "ALL" || ev.category === selectedCategory;
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Thanh Tìm Kiếm Trung Tâm */}
      <div className="max-w-2xl mx-auto">
        <div className="relative flex items-center w-full h-13 rounded-full bg-white border border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.06)] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all px-5">
          <Search className="size-5 text-primary shrink-0 mr-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm sự kiện, nghệ sĩ, đội tuyển hoặc địa điểm..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-400 outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs text-slate-400 hover:text-slate-600 ml-2"
            >
              Xóa
            </button>
          )}
        </div>
      </div>

      {/* Section: Sự kiện nổi bật */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Sự kiện nổi bật
          </h2>
          <Link
            href="/login"
            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Xem tất cả <ChevronRight className="size-4" />
          </Link>
        </div>

        {/* Lưới 4 cột poster dọc */}
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredEvents.map((event) => (
              <Link
                key={event.id}
                href="/login"
                className="group relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  unoptimized
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

                <button
                  type="button"
                  onClick={(e) => toggleFavorite(event.id, e)}
                  aria-label="Yêu thích"
                  className="absolute top-3.5 right-3.5 size-9 rounded-full bg-black/30 hover:bg-black/55 backdrop-blur-xs flex items-center justify-center text-white transition-colors"
                >
                  <Heart
                    className={`size-5 ${
                      favorites[event.id]
                        ? "fill-rose-500 text-rose-500"
                        : "text-white"
                    }`}
                  />
                </button>

                <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                  <h3 className="font-bold text-lg leading-snug line-clamp-2">
                    {event.title}
                  </h3>
                  <p className="text-xs text-zinc-200 font-medium">
                    {event.dateRange}
                  </p>
                  <p className="text-xs text-emerald-300 font-semibold pt-1">
                    Từ {event.minPrice.toLocaleString("vi-VN")} đ
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <button
            type="button"
            aria-label="Trượt sang phải"
            className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white border border-slate-200 shadow-md items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </section>

      {/* Thanh Bộ Lọc Nhanh dạng Pill */}
      <section className="flex flex-wrap items-center gap-2.5 pt-2">
        <button
          type="button"
          className="size-9 rounded-lg bg-primary text-white flex items-center justify-center shadow-xs hover:bg-primary/90 transition-colors"
          title="Định vị gần bạn"
        >
          <Navigation className="size-4" />
        </button>

        <button
          type="button"
          onClick={() =>
            setSelectedCity(
              selectedCity === "TP. Hồ Chí Minh" ? "Hà Nội" : "TP. Hồ Chí Minh",
            )
          }
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-primary/40 bg-primary/10 text-primary text-xs sm:text-sm font-semibold hover:bg-primary/15 transition-colors"
        >
          <MapPin className="size-3.5" />
          <span>{selectedCity}</span>
          <ChevronDown className="size-3.5" />
        </button>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <Calendar className="size-3.5" />
          <span>Tất cả các ngày</span>
          <ChevronDown className="size-3.5" />
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`h-9 px-3.5 rounded-lg text-xs sm:text-sm font-medium transition-colors border ${
                  active
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Banner Cam kết Bảo vệ Người mua (Tông Emerald & Slate hiện đại) */}
      <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 text-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Sparkles className="size-3.5" /> TicketHub Guarantee
          </div>
          <h3 className="text-xl sm:text-2xl font-bold">
            Đặt vé giữ chỗ 5 phút · Vé điện tử QR động chống giả mạo
          </h3>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Mọi giao dịch được bảo vệ chống bán trùng ghế, thanh toán trực tiếp
            qua cổng VNPay và làm mới mã QR mỗi 30 giây tại cổng soát vé.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
          >
            <QrCode className="size-4" /> Tạo tài khoản mua vé
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-xs transition-colors"
          >
            <ShieldCheck className="size-4" /> Đăng nhập ngay
          </Link>
        </div>
      </section>
    </div>
  );
}
