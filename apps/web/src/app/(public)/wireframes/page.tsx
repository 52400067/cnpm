"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search, MapPin, Calendar, CreditCard, QrCode, CheckCircle2,
  LayoutDashboard, Plus, Users, BarChart3, Settings,
  Ticket, ShieldCheck, ChevronRight, ArrowRight, Zap,
  User, Star, Clock, Smartphone,
} from "lucide-react";

type UserGroup = "buyer" | "organizer" | "gate";

const GROUPS: { id: UserGroup; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
  {
    id: "buyer",
    label: "Người mua vé",
    icon: <Ticket className="size-5" />,
    color: "emerald",
    desc: "Tìm kiếm sự kiện → chọn ghế → thanh toán → nhận vé QR",
  },
  {
    id: "organizer",
    label: "Ban tổ chức (BTC)",
    icon: <LayoutDashboard className="size-5" />,
    color: "blue",
    desc: "Tạo sự kiện → quản lý sơ đồ ghế → theo dõi doanh thu",
  },
  {
    id: "gate",
    label: "Nhân viên cổng",
    icon: <ShieldCheck className="size-5" />,
    color: "violet",
    desc: "Đăng nhập → chọn cổng → soát vé QR → báo cáo ca",
  },
];

// ─── Color helpers ────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, { badge: string; border: string; text: string; bg: string; btn: string }> = {
  emerald: {
    badge:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    border: "border-emerald-500/30",
    text:   "text-emerald-400",
    bg:     "bg-emerald-500/10",
    btn:    "bg-emerald-600 hover:bg-emerald-500",
  },
  blue: {
    badge:  "bg-blue-500/15 text-blue-400 border-blue-500/20",
    border: "border-blue-500/30",
    text:   "text-blue-400",
    bg:     "bg-blue-500/10",
    btn:    "bg-blue-600 hover:bg-blue-500",
  },
  violet: {
    badge:  "bg-violet-500/15 text-violet-400 border-violet-500/20",
    border: "border-violet-500/30",
    text:   "text-violet-400",
    bg:     "bg-violet-500/10",
    btn:    "bg-violet-600 hover:bg-violet-500",
  },
};

// ─── Wireframe: Buyer flow ─────────────────────────────────────────────────
function BuyerWireframe() {
  const [step, setStep] = useState(0);
  const c = COLOR_MAP.emerald;

  const steps = [
    {
      label: "Trang chủ & Tìm kiếm",
      screen: (
        <div className="space-y-3">
          {/* Search bar */}
          <div className="flex gap-2 bg-slate-800 rounded-xl p-3 border border-slate-700">
            <Search className="size-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-xs text-slate-500">Tìm kiếm sự kiện, nghệ sĩ...</div>
              <div className="h-px bg-slate-700 mt-2" />
            </div>
          </div>
          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap">
            {["Tất cả", "Hòa nhạc", "Thể thao", "Sân khấu"].map((f, i) => (
              <span key={f} className={`text-[11px] px-3 py-1 rounded-full border font-medium ${i === 0 ? c.badge : "bg-slate-800 text-slate-400 border-slate-700"}`}>{f}</span>
            ))}
          </div>
          {/* Event cards */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { title: "Hà Anh Tuấn: Sketch A Rose", date: "16 Th11", price: "1.200k+" },
              { title: "Anh Trai VNCG Live", date: "15 Th11", price: "800k+" },
            ].map((ev) => (
              <div key={ev.title} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                <div className="h-16 bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-slate-500">
                  <Calendar className="size-6" />
                </div>
                <div className="p-2.5 space-y-1">
                  <div className="text-[11px] font-semibold text-white leading-tight">{ev.title}</div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{ev.date}</span>
                    <span className="text-emerald-400 font-semibold">{ev.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      label: "Chọn ghế (SeatMap)",
      screen: (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 text-emerald-400" />
            <span className="text-xs text-slate-300 font-medium">Hà Anh Tuấn: Sketch A Rose · Nhà hát Hòa Bình</span>
          </div>
          {/* Seat map preview */}
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-4 space-y-2">
            <div className="text-center">
              <div className="inline-block bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-8 py-1.5 rounded-lg border border-emerald-500/30 mb-3">
                SÂN KHẤU
              </div>
            </div>
            {/* Seat rows mockup */}
            {[
              { label: "VIP", color: "bg-amber-500",  count: 12, sold: [2, 5, 9] },
              { label: "A",   color: "bg-emerald-500", count: 16, sold: [1, 4, 7, 11] },
              { label: "B",   color: "bg-blue-500",    count: 18, sold: [3, 8, 13] },
              { label: "C",   color: "bg-violet-500",  count: 20, sold: [2, 6, 10, 15, 18] },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-2">
                <span className="text-[9px] text-slate-500 w-6 text-right">{row.label}</span>
                <div className="flex gap-0.5 flex-wrap">
                  {Array.from({ length: row.count }).map((_, i) => (
                    <div
                      key={i}
                      className={`size-3 rounded-sm ${
                        row.sold.includes(i) ? "bg-slate-700 opacity-30" :
                        i === 3 ? "ring-2 ring-orange-400 bg-orange-500" :
                        row.color
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
            {/* Legend */}
            <div className="flex gap-3 pt-1 border-t border-slate-800 flex-wrap">
              {[
                { color: "bg-emerald-500", label: "Còn trống" },
                { color: "bg-orange-500",  label: "Đang chọn" },
                { color: "bg-slate-700 opacity-30", label: "Đã bán" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5 text-[9px] text-slate-400">
                  <span className={`size-2.5 rounded-sm ${l.color}`} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
          {/* Selection summary */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 px-3 py-2 flex items-center justify-between text-xs">
            <span className="text-slate-400">Đã chọn: <span className="text-white font-semibold">VIP-A3</span></span>
            <span className="text-emerald-400 font-bold">1.200.000 ₫</span>
          </div>
        </div>
      ),
    },
    {
      label: "Thanh toán",
      screen: (
        <div className="space-y-3">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-3 space-y-2">
            <div className="text-xs font-semibold text-white">Thông tin đặt vé</div>
            <div className="space-y-1 text-[11px] text-slate-400">
              <div className="flex justify-between"><span>Hà Anh Tuấn: Sketch A Rose</span></div>
              <div className="flex justify-between"><span>Ghế VIP-A3</span><span className="text-white">1.200.000 ₫</span></div>
              <div className="flex justify-between"><span>Phí dịch vụ</span><span className="text-white">30.000 ₫</span></div>
              <div className="border-t border-slate-700 pt-1 flex justify-between font-bold text-white text-xs">
                <span>Tổng cộng</span><span className="text-emerald-400">1.230.000 ₫</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-3 space-y-2">
            <div className="text-xs font-semibold text-white">Phương thức thanh toán</div>
            {[
              { icon: "🏦", label: "VNPay QR", active: true },
              { icon: "💳", label: "Thẻ ATM nội địa", active: false },
              { icon: "📱", label: "Ví điện tử (Momo)", active: false },
            ].map((m) => (
              <div key={m.label} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer ${m.active ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-slate-700 text-slate-400"}`}>
                <span>{m.icon}</span>
                <span className="font-medium">{m.label}</span>
                {m.active && <CheckCircle2 className="size-3.5 ml-auto" />}
              </div>
            ))}
          </div>

          <button className={`w-full py-3 rounded-xl text-white text-sm font-bold ${c.btn} transition-colors shadow-lg`}>
            Thanh toán 1.230.000 ₫
          </button>
        </div>
      ),
    },
    {
      label: "Vé điện tử (QR)",
      screen: (
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-2xl w-full max-w-[240px]">
            {/* Ticket header */}
            <div className="text-center mb-3">
              <div className="text-slate-900 font-extrabold text-sm">TicketHub</div>
              <div className="text-slate-500 text-[10px]">Vé điện tử chính thức</div>
            </div>
            {/* Event info */}
            <div className="border-y border-dashed border-slate-200 py-3 mb-3 space-y-1">
              <div className="text-slate-900 font-bold text-xs text-center leading-tight">Hà Anh Tuấn: Sketch A Rose</div>
              <div className="text-slate-500 text-[10px] text-center">16/11/2026 · 20:00 · Nhà hát Hòa Bình</div>
            </div>
            {/* QR placeholder */}
            <div className="size-28 bg-slate-100 rounded-xl mx-auto flex items-center justify-center border border-slate-200">
              <QrCode className="size-16 text-slate-800" />
            </div>
            <div className="mt-3 text-center">
              <div className="text-[11px] font-bold text-slate-900">VIP-A3</div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">TKH-2026-A3-X9K2</div>
            </div>
            {/* Notch */}
            <div className="ticket-notch-horizontal border-t border-dashed border-slate-200 mt-3 pt-2 text-center text-[9px] text-slate-400">
              Làm mới mỗi 30 giây · Không chụp màn hình
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <Clock className="size-3.5" />
            <span>Mã QR hợp lệ · Cập nhật sau 28s</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Step nav */}
      <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`flex-1 text-[10px] py-1.5 px-1 rounded-lg font-medium transition-all ${step === i ? `${c.btn} text-white shadow` : "text-slate-500 hover:text-slate-300"}`}
          >
            {i + 1}. {s.label.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Current step label */}
      <div className="flex items-center gap-2">
        <div className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${COLOR_MAP.emerald.btn}`}>{step + 1}</div>
        <span className="font-semibold text-white text-sm">{steps[step].label}</span>
      </div>

      {/* Screen mockup */}
      <div className="bg-slate-900 rounded-2xl border border-slate-700 p-4">
        {steps[step].screen}
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <button onClick={() => setStep((p) => Math.max(0, p - 1))} disabled={step === 0} className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          ← Bước trước
        </button>
        <button onClick={() => setStep((p) => Math.min(steps.length - 1, p + 1))} disabled={step === steps.length - 1} className={`flex-1 py-2 text-xs font-semibold rounded-xl text-white ${c.btn} disabled:opacity-30 disabled:cursor-not-allowed transition-colors`}>
          Bước tiếp →
        </button>
      </div>
    </div>
  );
}

// ─── Wireframe: Organizer flow ─────────────────────────────────────────────
function OrganizerWireframe() {
  const [tab, setTab] = useState<"dashboard" | "create" | "analytics">("dashboard");
  const c = COLOR_MAP.blue;

  return (
    <div className="space-y-4">
      {/* Tab nav */}
      <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
        {[
          { id: "dashboard" as const, label: "Dashboard", icon: <LayoutDashboard className="size-3" /> },
          { id: "create"    as const, label: "Tạo sự kiện", icon: <Plus className="size-3" /> },
          { id: "analytics" as const, label: "Doanh thu", icon: <BarChart3 className="size-3" /> },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1 text-[11px] py-1.5 rounded-lg font-medium transition-all ${tab === t.id ? `${c.btn} text-white shadow` : "text-slate-500 hover:text-slate-300"}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-700 p-4">

        {tab === "dashboard" && (
          <div className="space-y-3">
            <div className="text-sm font-bold text-white">Tổng quan sự kiện</div>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Sự kiện active", value: "3", icon: <Calendar className="size-4" />, color: "text-blue-400 bg-blue-500/10" },
                { label: "Vé đã bán", value: "1,420", icon: <Ticket className="size-4" />, color: "text-emerald-400 bg-emerald-500/10" },
                { label: "Người tham dự", value: "2,000", icon: <Users className="size-4" />, color: "text-violet-400 bg-violet-500/10" },
                { label: "Doanh thu", value: "3.2 tỷ", icon: <BarChart3 className="size-4" />, color: "text-amber-400 bg-amber-500/10" },
              ].map((s) => (
                <div key={s.label} className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                  <div className={`size-7 rounded-lg flex items-center justify-center ${s.color} mb-2`}>{s.icon}</div>
                  <div className="text-lg font-bold text-white tabular-nums">{s.value}</div>
                  <div className="text-[10px] text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
            {/* Recent events */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400">Sự kiện gần đây</div>
              {[
                { name: "Hà Anh Tuấn: Sketch A Rose", date: "16/11", sold: 890, total: 1200, pct: 74 },
                { name: "Rock Việt: Bức Tường Live",  date: "29/11", sold: 530, total: 800,  pct: 66 },
              ].map((ev) => (
                <div key={ev.name} className="bg-slate-800 rounded-xl p-3 border border-slate-700 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="text-xs font-semibold text-white leading-tight max-w-[160px]">{ev.name}</div>
                    <span className="text-[10px] text-slate-400">{ev.date}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{ev.sold}/{ev.total} vé</span>
                      <span className={c.text + " font-semibold"}>{ev.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${ev.pct}%` }} /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "create" && (
          <div className="space-y-3">
            <div className="text-sm font-bold text-white">Tạo sự kiện mới</div>
            {[
              { label: "Tên sự kiện", placeholder: "VD: Đêm nhạc Acoustic..." },
              { label: "Địa điểm", placeholder: "Nhà hát, sân vận động..." },
              { label: "Ngày & Giờ", placeholder: "DD/MM/YYYY HH:MM" },
            ].map((f) => (
              <div key={f.label} className="space-y-1">
                <div className="text-[11px] text-slate-400 font-medium">{f.label}</div>
                <div className="bg-slate-800 rounded-xl border border-slate-700 px-3 py-2.5 text-[11px] text-slate-500">{f.placeholder}</div>
              </div>
            ))}
            {/* Seat map config */}
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Cấu hình sơ đồ ghế</div>
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-3 space-y-2">
                {[
                  { zone: "Khu VIP",      seats: "200", price: "1.800.000" },
                  { zone: "Khán đài A",   seats: "600", price: "950.000" },
                  { zone: "Khán đài B",   seats: "1.200", price: "650.000" },
                ].map((z) => (
                  <div key={z.zone} className="flex justify-between text-[10px]">
                    <span className="text-slate-300">{z.zone}</span>
                    <span className="text-slate-500">{z.seats} ghế · {z.price}₫</span>
                  </div>
                ))}
                <button className={`w-full mt-1 py-1.5 rounded-lg text-[11px] font-semibold text-white ${c.btn} transition-colors`}>
                  + Thêm khu vực
                </button>
              </div>
            </div>
            <button className={`w-full py-2.5 rounded-xl text-sm font-bold text-white ${c.btn} transition-colors shadow-lg`}>
              Xuất bản sự kiện →
            </button>
          </div>
        )}

        {tab === "analytics" && (
          <div className="space-y-3">
            <div className="text-sm font-bold text-white">Báo cáo doanh thu</div>
            {/* Bar chart mockup */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-3">
              <div className="text-[11px] text-slate-400 mb-3">Vé bán theo ngày (7 ngày qua)</div>
              <div className="flex items-end gap-1.5 h-20">
                {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-blue-500/80 rounded-sm" style={{ height: `${h}%` }} />
                    <div className="text-[8px] text-slate-600">{["T2","T3","T4","T5","T6","T7","CN"][i]}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Revenue by tier */}
            {[
              { tier: "VIP",    revenue: "1.440.000.000", pct: 45, color: "bg-amber-500" },
              { tier: "Standard", revenue: "1.330.000.000", pct: 42, color: "bg-blue-500" },
              { tier: "Economy",  revenue: "420.000.000",  pct: 13, color: "bg-violet-500" },
            ].map((r) => (
              <div key={r.tier} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{r.tier}</span>
                  <span className="text-slate-400 tabular-nums">{r.revenue}₫</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full"><div className={`h-full ${r.color} rounded-full`} style={{ width: `${r.pct}%` }} /></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Wireframe: Gate Staff flow ────────────────────────────────────────────
function GateStaffWireframe() {
  const [step, setStep] = useState(0);
  const c = COLOR_MAP.violet;

  const steps = [
    {
      label: "Đăng nhập & Chọn cổng",
      screen: (
        <div className="space-y-3">
          <div className="text-center space-y-1">
            <div className={`size-14 rounded-2xl flex items-center justify-center mx-auto ${c.bg} border ${c.border}`}>
              <ShieldCheck className={`size-7 ${c.text}`} />
            </div>
            <div className="text-sm font-bold text-white">Đăng nhập nhân viên</div>
            <div className="text-[11px] text-slate-400">Xác thực trước khi soát vé</div>
          </div>
          <div className="space-y-2">
            {["ID nhân viên", "Mã PIN (6 số)"].map((f) => (
              <div key={f} className="bg-slate-800 rounded-xl border border-slate-700 px-3 py-2.5 text-[11px] text-slate-500">{f}</div>
            ))}
          </div>
          <div className="space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">Chọn điểm soát vé</div>
            {["CỔNG A (VIP)", "CỔNG B (Standard)", "CỔNG C (Economy)"].map((gate, i) => (
              <div key={gate} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] ${i === 0 ? `${c.bg} ${c.border} ${c.text} font-semibold` : "border-slate-700 text-slate-400"}`}>
                <div className={`size-2 rounded-full ${i === 0 ? "bg-violet-400" : "bg-slate-600"}`} />
                {gate}
              </div>
            ))}
          </div>
          <button className={`w-full py-2.5 rounded-xl text-sm font-bold text-white ${c.btn} transition-colors`}>
            Bắt đầu ca soát vé
          </button>
        </div>
      ),
    },
    {
      label: "Màn hình quét QR",
      screen: (
        <div className="space-y-3">
          {/* Mini gate scanner */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3">
            {/* Camera frame */}
            <div className="relative aspect-video bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center overflow-hidden">
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-white rounded-sm" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-white rounded-sm" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-white rounded-sm" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-white rounded-sm" />
              <div className="text-center space-y-1">
                <QrCode className="size-8 text-slate-600 mx-auto" />
                <div className="text-[10px] text-slate-600">Camera đang hoạt động</div>
              </div>
              {/* Scan line */}
              <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent"
                style={{ top: "50%", boxShadow: "0 0 8px #8b5cf6" }} />
            </div>
            {/* Controls */}
            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><Smartphone className="size-3" /> CỔNG A (VIP)</span>
              <span className={`flex items-center gap-1 ${c.text}`}><Zap className="size-3" /> Đang hoạt động</span>
            </div>
          </div>
          {/* Session counter */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Đã soát", value: "142", color: "text-emerald-400" },
              { label: "Từ chối", value: "3",   color: "text-red-400"     },
              { label: "Ca này",  value: "2h15", color: "text-slate-300"  },
            ].map((s) => (
              <div key={s.label} className="bg-slate-900 rounded-xl border border-slate-800 p-2 text-center">
                <div className={`font-bold tabular-nums ${s.color}`}>{s.value}</div>
                <div className="text-[9px] text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      label: "Kết quả soát vé",
      screen: (
        <div className="space-y-3">
          {/* Valid result */}
          <div className="bg-emerald-950 rounded-2xl border border-emerald-600 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                <CheckCircle2 className="size-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-emerald-400 font-bold">VÉ HỢP LỆ ✓</div>
                <div className="text-white font-semibold text-sm">Nguyễn Văn Minh</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {[
                { label: "Ghế", value: "VIP-A12" },
                { label: "Hạng", value: "VIP" },
                { label: "Cổng", value: "Cổng A" },
                { label: "Giờ vào", value: "19:45:23" },
              ].map((d) => (
                <div key={d.label} className="bg-emerald-900/30 rounded-lg px-2 py-1.5">
                  <div className="text-emerald-400/60">{d.label}</div>
                  <div className="text-white font-semibold">{d.value}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Invalid result preview */}
          <div className="bg-red-950/50 rounded-2xl border border-red-800/50 p-3 flex items-center gap-3 opacity-60">
            <div className="size-8 rounded-lg bg-red-500/20 flex items-center justify-center border border-red-500/30">
              <QrCode className="size-4 text-red-400" />
            </div>
            <div>
              <div className="text-red-400 font-semibold text-xs">VÉ KHÔNG HỢP LỆ</div>
              <div className="text-slate-500 text-[10px]">Lần soát trước — 19:42:11</div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
        {steps.map((s, i) => (
          <button key={i} onClick={() => setStep(i)}
            className={`flex-1 text-[10px] py-1.5 rounded-lg font-medium transition-all ${step === i ? `${c.btn} text-white shadow` : "text-slate-500 hover:text-slate-300"}`}>
            {i + 1}. {s.label.split(" ")[0]}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${c.btn}`}>{step + 1}</div>
        <span className="font-semibold text-white text-sm">{steps[step].label}</span>
      </div>
      <div className="bg-slate-900 rounded-2xl border border-slate-700 p-4">{steps[step].screen}</div>
      <div className="flex gap-2">
        <button onClick={() => setStep((p) => Math.max(0, p - 1))} disabled={step === 0} className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">← Trước</button>
        <button onClick={() => setStep((p) => Math.min(steps.length - 1, p + 1))} disabled={step === steps.length - 1} className={`flex-1 py-2 text-xs font-semibold rounded-xl text-white ${c.btn} disabled:opacity-30 transition-colors`}>Tiếp →</button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function WireframesPage() {
  const [activeGroup, setActiveGroup] = useState<UserGroup>("buyer");
  const group = GROUPS.find((g) => g.id === activeGroup)!;
  const c = COLOR_MAP[group.color];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">

      {/* Header */}
      <div className="space-y-2">
        <div className={`inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${c.badge}`}>
          <Star className="size-3" /> Thiết kế luồng trải nghiệm UX
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">UX Wireframes — 3 Nhóm Người Dùng</h1>
        <p className="text-slate-500 text-sm max-w-2xl">
          Mô phỏng tương tác trực quan luồng trải nghiệm cho toàn bộ hệ thống TicketHub: Người mua vé, Ban tổ chức sự kiện và Nhân viên soát vé cổng.
        </p>
      </div>

      {/* Group selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {GROUPS.map((g) => {
          const gc = COLOR_MAP[g.color];
          const isActive = activeGroup === g.id;
          return (
            <button key={g.id} onClick={() => setActiveGroup(g.id)}
              className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${isActive ? `${gc.bg} ${gc.border}` : "bg-slate-900 border-slate-800 hover:border-slate-700"}`}>
              <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? `${gc.btn} text-white` : `${gc.bg} ${gc.text}`}`}>
                {g.icon}
              </div>
              <div>
                <div className={`font-bold text-sm ${isActive ? "text-white" : "text-slate-300"}`}>{g.label}</div>
                <div className="text-[11px] text-slate-500 leading-snug mt-0.5">{g.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Wireframe content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div>
          {activeGroup === "buyer"     && <BuyerWireframe />}
          {activeGroup === "organizer" && <OrganizerWireframe />}
          {activeGroup === "gate"      && <GateStaffWireframe />}
        </div>

        {/* Info sidebar */}
        <div className="space-y-4">
          <div className={`bg-slate-900 rounded-2xl border p-4 space-y-3 ${c.border}`}>
            <div className={`font-bold text-sm ${c.text}`}>{group.label}</div>
            <div className="text-xs text-slate-400 leading-relaxed">{group.desc}</div>
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-300">UC / Màn hình phụ trách</div>
              {activeGroup === "buyer" && (
                <div className="space-y-1 text-[11px] text-slate-400">
                  {["Trang chủ & Tìm kiếm (UC02)", "Chọn ghế SeatMap (UC04)", "Thanh toán VNPay (UC05)", "Vé QR điện tử (UC05)", "Lịch sử vé (UC09)"].map((u) => (
                    <div key={u} className="flex items-center gap-2"><ChevronRight className="size-3 text-emerald-400 shrink-0" />{u}</div>
                  ))}
                </div>
              )}
              {activeGroup === "organizer" && (
                <div className="space-y-1 text-[11px] text-slate-400">
                  {["Dashboard BTC (UC07)", "Tạo & quản lý sự kiện (UC01)", "Cấu hình sơ đồ ghế (UC04)", "Báo cáo doanh thu (UC09)", "Upload ảnh sự kiện (UC10)"].map((u) => (
                    <div key={u} className="flex items-center gap-2"><ChevronRight className="size-3 text-blue-400 shrink-0" />{u}</div>
                  ))}
                </div>
              )}
              {activeGroup === "gate" && (
                <div className="space-y-1 text-[11px] text-slate-400">
                  {["Đăng nhập nhân viên (UC01)", "Chọn cổng soát vé (UC08)", "Quét QR & xác thực (UC08)", "Hiển thị kết quả (UC08)", "Thống kê ca làm việc"].map((u) => (
                    <div key={u} className="flex items-center gap-2"><ChevronRight className="size-3 text-violet-400 shrink-0" />{u}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Xem trực tiếp</div>
            <Link href="/seatmap-demo" className="flex items-center justify-between px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 hover:border-emerald-500/40 transition-colors text-xs text-slate-300 hover:text-white">
              <span>Demo SeatMap SVG</span><ArrowRight className="size-3.5 text-emerald-400" />
            </Link>
            <Link href="/gate-scanner" className="flex items-center justify-between px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 hover:border-violet-500/40 transition-colors text-xs text-slate-300 hover:text-white">
              <span>Gate Scanner PWA</span><ArrowRight className="size-3.5 text-violet-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
