"use client";

import { useMemo, useState } from "react";
import { SeatMap } from "@/components/seatmap/seat-map";
import { generateConcertSeatMap } from "@/components/seatmap/seatmap-data-mock";
import { Seat, SeatTier } from "@/components/seatmap/seatmap.types";
import {
  Sparkles, Smartphone, Layers, Zap,
  Hand, MousePointer2, Info, X, TicketCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TIER_CONFIG: Record<SeatTier, { label: string; colorClass: string; badgeBg: string }> = {
  VIP:      { label: "VIP",      colorClass: "text-amber-700",  badgeBg: "bg-amber-50 border-amber-200"   },
  STANDARD: { label: "Standard", colorClass: "text-emerald-700",badgeBg: "bg-emerald-50 border-emerald-200"},
  ECONOMY:  { label: "Economy",  colorClass: "text-purple-700", badgeBg: "bg-purple-50 border-purple-200"  },
};

const SEAT_COUNTS = [500, 1000, 2000] as const;

export default function SeatMapDemoPage() {
  const [seatCount, setSeatCount]       = useState<number>(2000);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [showTip, setShowTip]           = useState(true);

  const mockData     = useMemo(() => generateConcertSeatMap(seatCount), [seatCount]);
  const totalPrice   = useMemo(() => selectedSeats.reduce((s, seat) => s + seat.price, 0), [selectedSeats]);

  const byTier = useMemo(() => {
    const map: Partial<Record<SeatTier, Seat[]>> = {};
    for (const s of selectedSeats) {
      if (!map[s.tier]) map[s.tier] = [];
      map[s.tier]!.push(s);
    }
    return map;
  }, [selectedSeats]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-5">

      {/* ── Hero header (Clean White Theme) ── */}
      <div className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <Sparkles className="size-3 text-emerald-600" />
              Sơ đồ chỗ ngồi sự kiện
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Sơ đồ Ghế SVG Trực quan</h1>
            <p className="text-slate-500 text-sm max-w-xl">
              Trải nghiệm chọn ghế trực tiếp theo thời gian thực với cử chỉ cảm ứng kéo lướt (Touch Pan), thu phóng 2 ngón (Pinch-to-Zoom) và phân tầng hạng vé đồng bộ.
            </p>
          </div>

          {/* Seat count switcher */}
          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-medium">Quy mô mô phỏng</span>
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {SEAT_COUNTS.map((count) => (
                <button
                  key={count}
                  id={`seat-count-${count}`}
                  onClick={() => { setSeatCount(count); setSelectedSeats([]); }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    seatCount === count
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  {count.toLocaleString("vi-VN")}
                </button>
              ))}
            </div>
            <span className="text-emerald-600 font-bold text-sm tabular-nums">
              {mockData.totalSeats.toLocaleString("vi-VN")} ghế mô phỏng
            </span>
          </div>
        </div>
      </div>

      {/* ── Feature pills ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: <Smartphone className="size-4" />, color: "text-emerald-600 bg-emerald-50 border-emerald-100", title: "Touch Pan & Pinch-Zoom", desc: "1 ngón kéo lướt, 2 ngón thu phóng mượt 60 FPS trên mobile" },
          { icon: <Layers className="size-4" />,    color: "text-amber-600 bg-amber-50 border-amber-100",    title: "Phân vùng VIP / Standard / Economy", desc: "Hover xem mã ghế, hạng vé, giá bán và tình trạng giữ chỗ"       },
          { icon: <Zap className="size-4" />,       color: "text-blue-600 bg-blue-50 border-blue-100",      title: "Công nghệ SVG Vector", desc: "Hiển thị sắc nét không vỡ hạt dù phóng to ở mọi độ phân giải"         },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 border ${f.color}`}>{f.icon}</div>
            <div>
              <div className="font-semibold text-slate-900 text-xs">{f.title}</div>
              <div className="text-slate-500 text-[11px] leading-snug">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── UX tip (dismissible) ── */}
      {showTip && (
        <div className="flex items-start gap-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-4 py-3 text-xs text-emerald-800">
          <Info className="size-4 shrink-0 mt-0.5 text-emerald-600" />
          <div className="flex-1 flex flex-wrap gap-x-5 gap-y-1">
            <span className="flex items-center gap-1.5"><MousePointer2 className="size-3 text-emerald-600" /> Click ghế có màu để chọn chỗ</span>
            <span className="flex items-center gap-1.5"><Hand className="size-3 text-emerald-600" /> Kéo chuột hoặc ngón tay để di chuyển bản đồ</span>
            <span className="flex items-center gap-1.5"><Smartphone className="size-3 text-emerald-600" /> Dùng 2 ngón tay hoặc cuộn chuột để thu phóng</span>
          </div>
          <button onClick={() => setShowTip(false)} className="text-emerald-700/60 hover:text-emerald-800 transition-colors shrink-0 cursor-pointer" aria-label="Đóng">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-5 items-start">

        {/* SeatMap canvas */}
        <SeatMap
          data={mockData}
          selectedSeats={selectedSeats}
          maxSelectable={6}
          onSelectionChange={setSelectedSeats}
        />

        {/* Sidebar: selection + token reference */}
        <div className="space-y-3">

          {/* Seat basket */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <TicketCheck className="size-4 text-emerald-600" />
              <span className="font-semibold text-slate-900 text-sm">Giỏ vé đã chọn</span>
              {selectedSeats.length > 0 && (
                <span className="ml-auto text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-bold">
                  {selectedSeats.length} vé
                </span>
              )}
            </div>

            {selectedSeats.length > 0 ? (
              <>
                {(Object.entries(byTier) as [SeatTier, Seat[]][]).map(([tier, seats]) => {
                  const cfg = TIER_CONFIG[tier];
                  return (
                    <div key={tier} className={`rounded-xl px-3 py-2 border ${cfg.badgeBg}`}>
                      <div className={`text-[11px] font-bold ${cfg.colorClass} mb-1`}>{cfg.label} × {seats.length}</div>
                      <div className="flex flex-wrap gap-1">
                        {seats.map((s) => (
                          <span key={s.id} className="text-[10px] font-mono bg-white text-slate-700 border border-slate-200 rounded-md px-1.5 py-0.5">{s.code}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <div className="border-t border-slate-100 pt-2 flex justify-between items-center">
                  <span className="text-xs text-slate-500">Tổng tạm tính</span>
                  <span className="font-bold text-emerald-600">{totalPrice.toLocaleString("vi-VN")} ₫</span>
                </div>
                <Button variant="ghost" size="sm" className="w-full text-slate-500 hover:text-slate-900 text-xs h-8 cursor-pointer" onClick={() => setSelectedSeats([])}>
                  Bỏ chọn tất cả
                </Button>
              </>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs space-y-1.5">
                <div className="text-2xl">🎫</div>
                <div className="text-slate-600 font-medium">Chưa chọn ghế nào</div>
                <div className="text-slate-400 text-[11px]">Click vào ghế còn trống trên sơ đồ để bắt đầu</div>
              </div>
            )}
          </div>

          {/* Design token reference */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Màu sắc định danh</div>
            {[
              { color: "#10b981", token: "--seat-available", desc: "Ghế trống (Standard)"  },
              { color: "#f59e0b", token: "--seat-vip",       desc: "Ghế VIP"               },
              { color: "#8b5cf6", token: "--seat-economy",   desc: "Ghế Economy"           },
              { color: "#f97316", token: "--seat-selected",  desc: "Ghế đang chọn"         },
              { color: "#fef3c7", border: "#d97706", token: "--seat-held",      desc: "Ghế đang giữ chỗ"      },
              { color: "#e2e8f0", border: "#cbd5e1", token: "--seat-sold",      desc: "Ghế đã bán"            },
            ].map((t) => (
              <div key={t.token} className="flex items-center gap-2.5 py-1.5">
                <span
                  className="size-3.5 rounded shrink-0 border"
                  style={{
                    backgroundColor: t.color,
                    borderColor: t.border ?? "transparent",
                  }}
                />
                <div className="flex-1 min-w-0 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">{t.desc}</span>
                  <span className="font-mono text-slate-400 text-[10px]">{t.token}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
