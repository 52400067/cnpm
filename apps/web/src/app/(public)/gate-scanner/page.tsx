"use client";

import { useState, useEffect, useCallback } from "react";
import {
  QrCode, CheckCircle2, XCircle, Volume2, VolumeX,
  RefreshCw, ShieldCheck, Clock, User, Ticket,
  Flashlight, ChevronDown, Zap, Wifi, WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────
type ScanStatus = "idle" | "scanning" | "valid" | "invalid" | "duplicate";

interface ScanResult {
  status: "VALID" | "INVALID" | "DUPLICATE";
  attendeeName?: string;
  seatCode?: string;
  ticketTier?: string;
  gate?: string;
  checkinTime?: string;
  reason?: string;
}

// Mock scan results for demo
const MOCK_RESULTS: ScanResult[] = [
  {
    status: "VALID",
    attendeeName: "Nguyễn Văn Minh",
    seatCode: "VIP-A12",
    ticketTier: "VIP",
    gate: "Cổng A (VIP)",
    checkinTime: new Date().toLocaleTimeString("vi-VN"),
  },
  {
    status: "INVALID",
    reason: "Vé không hợp lệ hoặc đã hết hạn",
  },
  {
    status: "DUPLICATE",
    attendeeName: "Trần Thị Lan",
    seatCode: "STD-B7",
    checkinTime: "19:45:23",
    reason: "Vé này đã được quét lúc 19:45",
  },
];

// ─── Audio feedback via Web Audio API ─────────────────────────────────────
function playBeep(type: "success" | "error") {
  if (typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    }
  } catch {
    // AudioContext not available in SSR/test
  }
}

// ─── Authentic Standard QR Code (Version 2 — 25x25 matrix) ─────────────────
const QR_SIZE = 25;

function createStandardQrMatrix(): boolean[][] {
  const m: (boolean | null)[][] = Array.from({ length: QR_SIZE }, () =>
    Array(QR_SIZE).fill(null)
  );

  // 1. Finder patterns (7x7) + white separators
  const placeFinder = (startR: number, startC: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        m[startR + r][startC + c] = isBorder || isCenter;
      }
    }
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = startR + r;
        const nc = startC + c;
        if (nr >= 0 && nr < QR_SIZE && nc >= 0 && nc < QR_SIZE && m[nr][nc] === null) {
          m[nr][nc] = false;
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, QR_SIZE - 7);
  placeFinder(QR_SIZE - 7, 0);

  // 2. Alignment pattern at (18, 18) -> 5x5 (rows 16..20, cols 16..20)
  for (let r = 16; r <= 20; r++) {
    for (let c = 16; c <= 20; c++) {
      const isBorder = r === 16 || r === 20 || c === 16 || c === 20;
      const isCenter = r === 18 && c === 18;
      m[r][c] = isBorder || isCenter;
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < QR_SIZE - 8; i++) {
    if (m[6][i] === null) m[6][i] = i % 2 === 0;
    if (m[i][6] === null) m[i][6] = i % 2 === 0;
  }

  // 4. Dark module
  m[17][8] = true;

  // 5. Format info bits
  const formatBits = [true, false, true, false, true, false, false, true, false, true, true, false, true, false, true];
  for (let i = 0; i < 6; i++) {
    if (m[8][i] === null) m[8][i] = formatBits[i];
    if (m[i][8] === null) m[i][8] = formatBits[14 - i];
  }
  if (m[8][7] === null) m[8][7] = formatBits[6];
  if (m[8][8] === null) m[8][8] = formatBits[7];
  if (m[7][8] === null) m[7][8] = formatBits[8];

  for (let i = 0; i < 8; i++) {
    const colIdx = QR_SIZE - 1 - i;
    if (m[8][colIdx] === null) m[8][colIdx] = formatBits[i];
  }
  for (let i = 0; i < 7; i++) {
    const rowIdx = QR_SIZE - 7 + i;
    if (m[rowIdx][8] === null) m[rowIdx][8] = formatBits[7 + i];
  }

  // 6. Realistic data modules (deterministic hash)
  let hash = 0x811c9dc5;
  const nextBit = () => {
    hash ^= 0x01000193;
    hash = (hash * 16777619) & 0xffffffff;
    return (hash & 1) === 1;
  };

  for (let r = 0; r < QR_SIZE; r++) {
    for (let c = 0; c < QR_SIZE; c++) {
      if (m[r][c] === null) {
        m[r][c] = nextBit();
      }
    }
  }

  return m as boolean[][];
}

const QR_MATRIX = createStandardQrMatrix();

function StandardQrCode({ className = "size-36" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 29 29"
      className={className}
      shapeRendering="crispEdges"
      aria-label="Mã QR vé điện tử chuẩn"
    >
      <rect width="29" height="29" fill="#ffffff" rx="1.5" />
      {QR_MATRIX.map((row, r) =>
        row.map((isDark, c) =>
          isDark ? (
            <rect
              key={`${r}-${c}`}
              x={c + 2}
              y={r + 2}
              width="1"
              height="1"
              fill="#0f172a"
            />
          ) : null
        )
      )}
    </svg>
  );
}

// ─── QR Countdown ring ────────────────────────────────────────────────────
function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = circ * (seconds / total);
  const pct = Math.round((seconds / total) * 100);
  const color = pct > 40 ? "#10b981" : pct > 15 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#1e293b" strokeWidth="4" />
        <circle
          cx="28" cy="28" r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.9s linear, stroke 0.3s" }}
        />
      </svg>
      <span className="absolute text-xs font-bold tabular-nums" style={{ color }}>
        {seconds}s
      </span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function GateScannerPage() {
  const [gate, setGate]           = useState("CỔNG A (VIP)");
  const [sound, setSound]         = useState(true);
  const [torch, setTorch]         = useState(false);
  const [online, setOnline]       = useState(true);
  const [countdown, setCountdown] = useState(28);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("scanning");
  const [result, setResult]       = useState<ScanResult | null>(null);
  const [scanned, setScanned]     = useState(1_420);
  const [total]                   = useState(2_000);
  const [mockIdx, setMockIdx]     = useState(0);

  // QR countdown 30s
  useEffect(() => {
    const id = setInterval(() => setCountdown((p) => (p <= 1 ? 30 : p - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  // Online status
  useEffect(() => {
    const up   = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online",  up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);

  // Simulate scan
  const handleScan = useCallback(() => {
    setScanStatus("scanning");
    setResult(null);

    setTimeout(() => {
      const r = MOCK_RESULTS[mockIdx % MOCK_RESULTS.length];
      setMockIdx((p) => p + 1);
      setResult(r);

      if (r.status === "VALID") {
        setScanStatus("valid");
        setScanned((p) => p + 1);
        if (sound) playBeep("success");
      } else {
        setScanStatus(r.status === "DUPLICATE" ? "duplicate" : "invalid");
        if (sound) playBeep("error");
      }

      // Auto-reset after 3.5s
      setTimeout(() => { setScanStatus("scanning"); setResult(null); }, 3500);
    }, 600);
  }, [mockIdx, sound]);

  const statusColors = {
    idle:      { bg: "bg-slate-900",   border: "border-slate-800", text: "text-slate-400" },
    scanning:  { bg: "bg-slate-900",   border: "border-slate-700", text: "text-slate-300" },
    valid:     { bg: "bg-emerald-950", border: "border-emerald-600", text: "text-emerald-400" },
    invalid:   { bg: "bg-red-950",     border: "border-red-600",     text: "text-red-400"     },
    duplicate: { bg: "bg-amber-950",   border: "border-amber-600",   text: "text-amber-400"   },
  };
  const sc = statusColors[scanStatus];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">

      {/* ── Top status bar ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-[11px]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-3.5 text-emerald-400" />
          <span className="text-slate-400 font-medium">Hệ thống soát vé TicketHub</span>
        </div>
        <div className="flex items-center gap-3">
          {online
            ? <span className="flex items-center gap-1 text-emerald-400"><Wifi className="size-3" />Online</span>
            : <span className="flex items-center gap-1 text-red-400"><WifiOff className="size-3" />Offline</span>
          }
          <span className="text-slate-500">{new Date().toLocaleTimeString("vi-VN")}</span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">

        {/* ── Gate selector ── */}
        <div className="flex items-center gap-3 bg-slate-900 rounded-2xl border border-slate-800 px-4 py-3">
          <div className="size-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
            <Zap className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Điểm soát vé</div>
            <select
              value={gate}
              onChange={(e) => setGate(e.target.value)}
              className="bg-transparent font-bold text-white text-sm focus:outline-none w-full cursor-pointer"
            >
              {["CỔNG A (VIP)", "CỔNG B (Standard)", "CỔNG C (Economy)", "CỔNG D (VIP)"].map((g) => (
                <option key={g} value={g} className="bg-slate-900 text-white">{g}</option>
              ))}
            </select>
          </div>
          <ChevronDown className="size-4 text-slate-500 shrink-0" />
        </div>

        {/* ── Scanner viewport ── */}
        <div className={`relative rounded-3xl overflow-hidden border-2 transition-all duration-300 ${sc.bg} ${sc.border} shadow-2xl`}>

          {/* Camera frame */}
          <div className="relative aspect-square flex items-center justify-center">

            {/* Corner marks */}
            {["top-4 left-4 border-t-2 border-l-2", "top-4 right-4 border-t-2 border-r-2",
              "bottom-4 left-4 border-b-2 border-l-2", "bottom-4 right-4 border-b-2 border-r-2"].map((cls, i) => (
              <div key={i} className={`absolute w-8 h-8 ${cls} border-white rounded-sm`} />
            ))}

            {/* Status icon / QR placeholder */}
            {scanStatus === "scanning" && (
              <div className="flex flex-col items-center gap-4">
                {/* Standard authentic QR code */}
                <div className="relative size-44 bg-white rounded-2xl p-2.5 shadow-2xl flex items-center justify-center overflow-hidden">
                  <StandardQrCode className="size-full" />
                  {/* Laser scan line sweeping across */}
                  <div
                    className="scan-line absolute inset-x-0"
                    style={{ animation: "scan-sweep 2.2s ease-in-out infinite" }}
                  />
                </div>

                <div className="text-slate-400 text-xs font-medium">Hướng camera vào mã QR vé</div>
              </div>
            )}

            {scanStatus === "valid" && (
              <div className="flex flex-col items-center gap-3 animate-zoom-in p-6">
                <div className="size-20 rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500">
                  <CheckCircle2 className="size-10 text-emerald-400" />
                </div>
                <div className="text-center">
                  <div className="text-emerald-400 font-bold text-xl">VÉ HỢP LỆ</div>
                  <div className="text-white font-semibold mt-1">{result?.attendeeName}</div>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      {result?.ticketTier}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{result?.seatCode}</span>
                  </div>
                </div>
              </div>
            )}

            {(scanStatus === "invalid" || scanStatus === "duplicate") && (
              <div className="flex flex-col items-center gap-3 animate-zoom-in p-6">
                <div className={`size-20 rounded-full flex items-center justify-center border-2 ${
                  scanStatus === "invalid" ? "bg-red-500/20 border-red-500" : "bg-amber-500/20 border-amber-500"
                }`}>
                  <XCircle className={`size-10 ${scanStatus === "invalid" ? "text-red-400" : "text-amber-400"}`} />
                </div>
                <div className="text-center">
                  <div className={`font-bold text-lg ${scanStatus === "invalid" ? "text-red-400" : "text-amber-400"}`}>
                    {scanStatus === "invalid" ? "VÉ KHÔNG HỢP LỆ" : "VÉ ĐÃ ĐƯỢC QUÉT"}
                  </div>
                  <div className="text-slate-400 text-xs mt-1 max-w-[200px]">{result?.reason}</div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom camera controls */}
          <div className="flex items-center justify-between px-4 pb-4 pt-2">
            <button
              onClick={() => setTorch((p) => !p)}
              className={`size-10 rounded-full flex items-center justify-center transition-colors ${torch ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-slate-400 hover:text-white"}`}
              aria-label="Đèn flash"
            >
              <Flashlight className="size-4" />
            </button>

            {/* Simulate scan button */}
            <button
              onClick={handleScan}
              className="size-16 rounded-full bg-white flex items-center justify-center shadow-xl active:scale-95 transition-transform"
              aria-label="Mô phỏng quét QR"
            >
              <QrCode className="size-7 text-slate-900" />
            </button>

            <button
              onClick={() => setSound((p) => !p)}
              className={`size-10 rounded-full flex items-center justify-center transition-colors ${sound ? "bg-slate-800 text-white" : "bg-slate-800 text-slate-600"}`}
              aria-label={sound ? "Tắt âm thanh" : "Bật âm thanh"}
            >
              {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>
          </div>
        </div>

        {/* ── QR countdown + refresh ── */}
        <div className="flex items-center justify-between bg-slate-900 rounded-2xl border border-slate-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <CountdownRing seconds={countdown} total={30} />
            <div>
              <div className="font-semibold text-sm">Mã QR tự làm mới</div>
              <div className="text-slate-500 text-xs">Mã xoay vòng mỗi 30 giây để bảo mật</div>
            </div>
          </div>
          <button
            onClick={() => setCountdown(30)}
            className="size-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            aria-label="Làm mới mã QR"
          >
            <RefreshCw className="size-3.5" />
          </button>
        </div>

        {/* ── Session stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Đã vào", value: scanned.toLocaleString("vi-VN"), color: "text-emerald-400" },
            { label: "Còn lại", value: (total - scanned).toLocaleString("vi-VN"), color: "text-slate-300" },
            { label: "Tổng vé", value: total.toLocaleString("vi-VN"), color: "text-slate-400" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900 rounded-xl border border-slate-800 p-3 text-center">
              <div className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Tiến độ check-in</span>
            <span className="font-semibold text-white">{Math.round((scanned / total) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${(scanned / total) * 100}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-600 text-center">
            {gate} · Nhân viên soát vé
          </div>
        </div>

        {/* Demo note */}
        <div className="text-center text-[10px] text-slate-600 pb-4 pb-safe">
          Nhấn nút quét ở giữa để mô phỏng các kịch bản soát vé thực tế
        </div>
      </div>
    </div>
  );
}
