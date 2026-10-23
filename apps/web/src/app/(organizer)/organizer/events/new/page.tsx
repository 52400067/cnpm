"use client";

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";
import { SeatMap } from "@/components/events/seat-map";
import { type VenueMapKey } from "@/lib/venue-svg.generated";
import { formatVnd } from "@/lib/events-catalog";

interface VenueTemplateOption {
  key: VenueMapKey;
  title: string;
  category: string;
  capacityEstimate: string;
  description: string;
  realVenuesExample: string;
  defaultZones: Array<{
    zoneId: string;
    name: string;
    price: number;
    capacity: number;
    isSeated: boolean;
  }>;
}

const VENUE_TEMPLATES: VenueTemplateOption[] = [
  {
    key: "arena-t-stage",
    title: "Sân Khấu Chữ T (Nhà thi đấu)",
    category: "Âm nhạc / Live Concert",
    capacityEstimate: "8.000 - 15.000 chỗ",
    description: "Thiết kế sân khấu chữ T vươn dài ra giữa sàn đấu, khán đài ôm trọn 3 phía.",
    realVenuesExample: "Nhà thi đấu Quân Khu 7, Phú Thọ, SECC, Điền Kinh Hà Nội",
    defaultZones: [
      { zoneId: "495", name: "HẠNG A (Mặt sàn T-Stage)", price: 2500000, capacity: 1200, isSeated: true },
      { zoneId: "496", name: "HẠNG B (Tầng 1 đối diện)", price: 1800000, capacity: 2500, isSeated: true },
      { zoneId: "497", name: "HẠNG C (Khán đài tầng trung)", price: 1200000, capacity: 3500, isSeated: true },
      { zoneId: "504", name: "HẠNG D (Khán đài tầng cao)", price: 800000, capacity: 4000, isSeated: true },
    ],
  },
  {
    key: "stadium-concert",
    title: "SVĐ Mega Concert (Sân khấu ngoài trời)",
    category: "Đại nhạc hội / Festival",
    capacityEstimate: "30.000 - 60.000 chỗ",
    description: "Sơ đồ sân vận động với sân khấu siêu lớn ở đầu cầu môn, kết hợp fanzone sân cỏ và 3 tầng khán đài.",
    realVenuesExample: "SVĐ Quốc Gia Mỹ Đình, SVĐ Thống Nhất, SVĐ Cần Thơ",
    defaultZones: [
      { zoneId: "508", name: "VIP ĐỨNG (Fanzone sát sân khấu)", price: 3200000, capacity: 4000, isSeated: false },
      { zoneId: "509", name: "SÂN CỎ ĐỨNG (Khu Đứng Tự Do)", price: 1900000, capacity: 12000, isSeated: false },
      { zoneId: "510", name: "KHÁN ĐÀI TẦNG 100 (Cận cảnh)", price: 2400000, capacity: 10000, isSeated: true },
      { zoneId: "511", name: "KHÁN ĐÀI TẦNG 400 (Tầm nhìn rộng)", price: 1400000, capacity: 15000, isSeated: true },
      { zoneId: "512", name: "KHÁN ĐÀI TẦNG 600 (Toàn cảnh)", price: 750000, capacity: 12000, isSeated: true },
    ],
  },
  {
    key: "stadium-football",
    title: "Sân Vận Động (Sân bóng đá thể thao)",
    category: "Bóng đá / Giải vô địch",
    capacityEstimate: "20.000 - 45.000 chỗ",
    description: "Khán đài 4 phía bao quanh mặt sân cỏ chuẩn FIFA (Khán đài A VIP, Khán đài B, C, D).",
    realVenuesExample: "SVĐ Mỹ Đình, SVĐ Hàng Đẫy, SVĐ Lạch Tray, Thiên Trường",
    defaultZones: [
      { zoneId: "508", name: "KHÁN ĐÀI A - VIP (Trung tâm)", price: 800000, capacity: 3000, isSeated: true },
      { zoneId: "509", name: "KHÁN ĐÀI B (Khán đài chính)", price: 500000, capacity: 12000, isSeated: true },
      { zoneId: "510", name: "KHÁN ĐÀI C / D (Sau khung thành)", price: 300000, capacity: 15000, isSeated: true },
      { zoneId: "511", name: "KHÁN ĐÀI TRÊN (Tầng 2)", price: 200000, capacity: 10000, isSeated: true },
    ],
  },
  {
    key: "arena-basketball",
    title: "Sàn Thi Đấu Thể Thao (Bóng rổ / Võ thuật)",
    category: "Thể thao trong nhà / VBA",
    capacityEstimate: "3.000 - 8.000 chỗ",
    description: "Sân đấu gỗ chuẩn quốc tế với hàng ghế Sát Sân và khán đài vòng cung.",
    realVenuesExample: "Nhà thi đấu Hồ Xuân Hương, Cầu Giấy, Tây Hồ, Tân Bình",
    defaultZones: [
      { zoneId: "518", name: "VIP SÁT SÂN (Sát sàn đấu)", price: 1500000, capacity: 300, isSeated: true },
      { zoneId: "519", name: "KHÁN ĐÀI VIP (Trung tâm)", price: 750000, capacity: 1200, isSeated: true },
      { zoneId: "520", name: "KHÁN ĐÀI TẦNG DƯỚI", price: 450000, capacity: 2500, isSeated: true },
      { zoneId: "521", name: "KHÁN ĐÀI TẦNG TRÊN", price: 250000, capacity: 3000, isSeated: true },
    ],
  },
  {
    key: "theater",
    title: "Nhà Hát & Khán Phòng Thính Phòng",
    category: "Kịch / Stand-up Comedy / Acoustic",
    capacityEstimate: "1.000 - 3.000 chỗ",
    description: "Khán phòng thính phòng với hàng ghế phân tầng dốc cao, âm học chuẩn cho sân khấu nghệ thuật.",
    realVenuesExample: "Nhà hát Hòa Bình, Nhà hát Lớn Hà Nội, Cung Văn Hóa Việt Xô",
    defaultZones: [
      { zoneId: "518", name: "VIP CHÍNH DIỆN (Trung tâm khán phòng)", price: 1200000, capacity: 250, isSeated: true },
      { zoneId: "519", name: "KHÁN PHÒNG CHÍNH (Tầng trệt)", price: 800000, capacity: 800, isSeated: true },
      { zoneId: "520", name: "TẦNG LỬNG (Khán phòng giữa)", price: 500000, capacity: 600, isSeated: true },
      { zoneId: "521", name: "BAN CÔNG (Tầng cao)", price: 300000, capacity: 500, isSeated: true },
    ],
  },
];

function NewEventContent() {
  const searchParams = useSearchParams();
  const initialStep = Math.min(4, Math.max(1, parseInt(searchParams.get("step") ?? "1", 10) || 1)) as 1 | 2 | 3 | 4;
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialStep);

  // Step 1: Event Info
  const [title, setTitle] = useState("Live Concert Mùa Thu Hà Nội");
  const [category, setCategory] = useState("Âm nhạc");
  const [venueName, setVenueName] = useState("Cung Điền Kinh Trong Nhà Hà Nội");
  const [venueAddress, setVenueAddress] = useState("Đường Trần Hữu Dực, Cầu Diễn, Nam Từ Liêm");
  const [city, setCity] = useState("Hà Nội");
  const [eventDate, setEventDate] = useState("2027-11-20T19:30");

  // Step 2: Venue Template
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<VenueMapKey>("arena-t-stage");
  const selectedTemplate = useMemo(
    () => VENUE_TEMPLATES.find((t) => t.key === selectedTemplateKey) ?? VENUE_TEMPLATES[0],
    [selectedTemplateKey]
  );

  // Step 3: Zone Pricing & Capacity
  const [zones, setZones] = useState(selectedTemplate.defaultZones);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  // When switching template, reset zones
  const handleSelectTemplate = (key: VenueMapKey) => {
    setSelectedTemplateKey(key);
    const tmpl = VENUE_TEMPLATES.find((t) => t.key === key) ?? VENUE_TEMPLATES[0];
    setZones(tmpl.defaultZones);
    setActiveZoneId(null);
  };

  const handleUpdateZone = (zoneId: string, field: "price" | "capacity", value: number) => {
    setZones((prev) =>
      prev.map((z) => (z.zoneId === zoneId ? { ...z, [field]: value } : z))
    );
  };

  // Build zoneInfoMap for the SVG map preview
  const zoneInfoMap = useMemo(() => {
    const map: Record<string, { name: string; minPrice: number; count: number }> = {};
    for (const z of zones) {
      map[z.zoneId] = {
        name: z.name,
        minPrice: z.price,
        count: z.capacity,
      };
    }
    return map;
  }, [zones]);

  // Aggregate stats
  const totalCapacity = useMemo(() => zones.reduce((sum, z) => sum + z.capacity, 0), [zones]);
  const projectedRevenue = useMemo(
    () => zones.reduce((sum, z) => sum + z.price * z.capacity, 0),
    [zones]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmitEvent = () => {
    setIsSubmitting(true);
    // Simulate saving event and generating seat allocations
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 800);
  };

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* Top Header & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-[12px] text-slate-500 font-medium mb-1.5">
          <Link href="/organizer/events" className="hover:text-primary transition-colors">
            Sự kiện của tôi
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">Tạo sự kiện mới</span>
        </div>
        <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-slate-900">
          Tạo sự kiện &amp; Chọn mẫu sơ đồ địa điểm
        </h1>
        <p className="text-[14px] text-slate-500">
          Chọn mô hình khán đài kiến trúc chuẩn, thiết lập giá vé từng phân khu và sẵn sàng mở bán.
        </p>
      </div>

      {/* Stepper Progress Indicator */}
      <div className="grid grid-cols-4 gap-2 border-b border-slate-200 pb-4">
        {[
          { num: 1, title: "1. Thông tin sự kiện" },
          { num: 2, title: "2. Chọn mẫu sơ đồ" },
          { num: 3, title: "3. Cấu hình giá & vé" },
          { num: 4, title: "4. Hoàn tất & Mở bán" },
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setStep(s.num as 1 | 2 | 3 | 4)}
            className={`text-left pb-2 border-b-2 font-bold text-[13px] transition-colors ${
              step === s.num
                ? "border-primary text-primary"
                : step > s.num
                ? "border-emerald-500 text-emerald-700"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* STEP 1: Basic Information */}
      {step === 1 && (
        <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-2xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-[18px] font-extrabold text-slate-900">
              Bước 1: Thông tin sự kiện cơ bản
            </h2>
            <p className="text-[13px] text-slate-500">
              Nhập tên chương trình, thể loại và thông tin địa điểm tổ chức tại Việt Nam.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-[13px]">
            <div className="space-y-1.5 md:col-span-2">
              <label className="font-bold text-slate-700">Tên sự kiện / Chương trình *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Live Concert Vũ - Bảo Tàng Của Nuối Tiếc"
                className="w-full h-11 px-3.5 rounded-[10px] border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Thể loại sự kiện *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-3.5 rounded-[10px] border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-primary"
              >
                <option value="Âm nhạc">Âm nhạc / Live Concert</option>
                <option value="Thể thao">Thể thao / Bóng đá / Bóng rổ</option>
                <option value="Sân khấu">Sân khấu / Hài kịch / Nghệ thuật</option>
                <option value="Festival">Lễ hội âm nhạc / EDM Festival</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Thời gian bắt đầu *</label>
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-[10px] border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Tên địa điểm tổ chức *</label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="VD: Cung Điền Kinh Hà Nội, SVĐ Mỹ Đình..."
                className="w-full h-11 px-3.5 rounded-[10px] border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Thành phố *</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-11 px-3.5 rounded-[10px] border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-primary"
              >
                <option value="Hà Nội">Hà Nội</option>
                <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
                <option value="Hải Phòng">Hải Phòng</option>
                <option value="Cần Thơ">Cần Thơ</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="font-bold text-slate-700">Địa chỉ chi tiết *</label>
              <input
                type="text"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                placeholder="Số đường, phường/xã, quận/huyện..."
                className="w-full h-11 px-3.5 rounded-[10px] border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-6 h-11 rounded-[10px] bg-primary hover:bg-emerald-700 text-white text-[13px] font-bold transition-colors"
            >
              Tiếp tục: Chọn mẫu sơ đồ địa điểm
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Venue Template Selector with Interactive SVG Preview */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-2xs space-y-4">
            <div className="space-y-1">
              <h2 className="text-[18px] font-extrabold text-slate-900">
                Bước 2: Chọn mẫu sơ đồ khán đài kiến trúc
              </h2>
              <p className="text-[13px] text-slate-500">
                Hệ thống TicketHub cung cấp 5 mô hình không gian biểu diễn tiêu chuẩn tại Việt Nam. Chọn mẫu phù hợp với sân vận động hoặc nhà thi đấu của bạn:
              </p>
            </div>

            {/* Template Selector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
              {VENUE_TEMPLATES.map((tmpl) => {
                const isSelected = tmpl.key === selectedTemplateKey;
                return (
                  <button
                    key={tmpl.key}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl.key)}
                    className={`p-4 rounded-[12px] border text-left transition-all relative ${
                      isSelected
                        ? "border-primary bg-emerald-50/50 shadow-xs ring-1 ring-primary"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                        {tmpl.category}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="size-4 text-primary shrink-0" />
                      )}
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-[14px]">
                      {tmpl.title}
                    </h3>
                    <p className="text-[12px] text-slate-600 mt-1 line-clamp-2">
                      {tmpl.description}
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[11px] text-slate-500 space-y-1">
                      <div>
                        <span className="font-semibold text-slate-700">Sức chứa:</span>{" "}
                        {tmpl.capacityEstimate}
                      </div>
                      <div className="line-clamp-1">
                        <span className="font-semibold text-slate-700">Ví dụ:</span>{" "}
                        {tmpl.realVenuesExample}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive SVG Seatmap Live Preview */}
          <div className="bg-white rounded-[16px] border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80">
              <div>
                <h3 className="text-[15px] font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers className="size-4 text-primary" />
                  Xem trước trực tiếp: {selectedTemplate.title}
                </h3>
                <p className="text-[12px] text-slate-500">
                  Bạn có thể dùng chuột kéo rê để xoay góc nhìn, lăn chuột hoặc bấm nút để phóng to / thu nhỏ.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                {zones.length} khu vực khán đài
              </span>
            </div>

            <div className="h-[460px] sm:h-[520px] bg-[#f8fafc] relative">
              <SeatMap
                mapKey={selectedTemplateKey}
                activeZoneId={activeZoneId}
                hoveredZoneId={hoveredZoneId}
                zoneInfoMap={zoneInfoMap}
                onSelectZone={(id) => setActiveZoneId(id)}
                onHoverZone={(id) => setHoveredZoneId(id)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-[10px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-bold transition-colors"
            >
              <ArrowLeft className="size-4" />
              Quay lại
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-6 h-11 rounded-[10px] bg-primary hover:bg-emerald-700 text-white text-[13px] font-bold transition-colors shadow-xs"
            >
              Tiếp tục: Cấu hình giá &amp; số lượng vé
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Zone Pricing and Capacity Configuration */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-extrabold text-slate-900">
                  Bước 3: Cấu hình giá vé và sức chứa theo Khu vực
                </h2>
                <p className="text-[13px] text-slate-500">
                  Điều chỉnh đơn giá (VND) và số lượng vé phân bổ cho từng khu khán đài của mẫu{" "}
                  <strong>{selectedTemplate.title}</strong>.
                </p>
              </div>
              <div className="text-right">
                <span className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  Doanh thu dự kiến
                </span>
                <span className="text-[20px] font-extrabold text-primary">
                  {formatVnd(projectedRevenue)}
                </span>
              </div>
            </div>

            {/* Zone Pricing Table */}
            <div className="border border-slate-200 rounded-[12px] overflow-hidden">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Khu vực khán đài</th>
                    <th className="py-3 px-4">Loại hình</th>
                    <th className="py-3 px-4">Đơn giá vé (VND)</th>
                    <th className="py-3 px-4">Sức chứa (Vé)</th>
                    <th className="py-3 px-4 text-right">Tổng thu dự kiến</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {zones.map((zone) => {
                    const rowRevenue = zone.price * zone.capacity;
                    return (
                      <tr key={zone.zoneId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {zone.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                              zone.isSeated
                                ? "bg-blue-50 text-blue-700"
                                : "bg-purple-50 text-purple-700"
                            }`}
                          >
                            {zone.isSeated ? "Ghế ngồi có số" : "Đứng tự do (Fanzone)"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <input
                            type="number"
                            step="50000"
                            min="50000"
                            value={zone.price}
                            onChange={(e) =>
                              handleUpdateZone(
                                zone.zoneId,
                                "price",
                                Math.max(0, parseInt(e.target.value, 10) || 0)
                              )
                            }
                            className="w-36 h-9 px-3 rounded-[8px] border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-primary"
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <input
                            type="number"
                            step="50"
                            min="10"
                            value={zone.capacity}
                            onChange={(e) =>
                              handleUpdateZone(
                                zone.zoneId,
                                "capacity",
                                Math.max(1, parseInt(e.target.value, 10) || 1)
                              )
                            }
                            className="w-28 h-9 px-3 rounded-[8px] border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-primary"
                          />
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                          {formatVnd(rowRevenue)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-[12px] bg-slate-50 border border-slate-200 text-[13px]">
              <div>
                <span className="text-slate-500 block text-[11px] font-semibold uppercase">
                  Tổng số vé phát hành:
                </span>
                <span className="font-extrabold text-[16px] text-slate-900">
                  {totalCapacity.toLocaleString("vi-VN")} vé
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-semibold uppercase">
                  Số phân khu khán đài:
                </span>
                <span className="font-extrabold text-[16px] text-slate-900">
                  {zones.length} khu vực
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-semibold uppercase">
                  Doanh thu cực đại:
                </span>
                <span className="font-extrabold text-[16px] text-primary">
                  {formatVnd(projectedRevenue)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-[10px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-bold transition-colors"
            >
              <ArrowLeft className="size-4" />
              Quay lại sơ đồ
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-2 px-6 h-11 rounded-[10px] bg-primary hover:bg-emerald-700 text-white text-[13px] font-bold transition-colors shadow-xs"
            >
              Tiếp tục: Xem lại &amp; Xuất bản
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review and Publish */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="space-y-1">
              <h2 className="text-[18px] font-extrabold text-slate-900">
                Bước 4: Kiểm tra thông tin &amp; Xuất bản sự kiện
              </h2>
              <p className="text-[13px] text-slate-500">
                Hệ thống sẽ tạo tự động toàn bộ vị trí chỗ ngồi, liên kết với sơ đồ khán đài và cấp mã vé điện tử bảo mật.
              </p>
            </div>

            {isSubmitted ? (
              <div className="py-10 text-center space-y-4">
                <div className="size-16 rounded-full bg-emerald-100 text-primary mx-auto flex items-center justify-center">
                  <CheckCircle2 className="size-9" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-[20px] font-extrabold text-slate-900">
                    Sự kiện đã được tạo thành công!
                  </h3>
                  <p className="text-[14px] text-slate-600 max-w-md mx-auto">
                    Mẫu sơ đồ <strong>{selectedTemplate.title}</strong> cùng {totalCapacity.toLocaleString("vi-VN")} vé đã được khởi tạo trong hệ thống.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                  <Link
                    href="/events/evt-anh-trai-vuot-ngan-chong-gai"
                    className="inline-flex items-center gap-2 px-5 h-11 rounded-[10px] bg-primary hover:bg-emerald-700 text-white text-[13px] font-bold transition-colors"
                  >
                    <Sparkles className="size-4" />
                    Xem trang bán vé &amp; Sơ đồ trực tiếp
                  </Link>
                  <Link
                    href="/organizer/events"
                    className="inline-flex items-center gap-2 px-5 h-11 rounded-[10px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-bold transition-colors"
                  >
                    Về danh sách sự kiện
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-slate-50 rounded-[14px] border border-slate-200 text-[13px]">
                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-400 block text-[11px] font-bold uppercase">
                        Tên chương trình:
                      </span>
                      <span className="font-extrabold text-slate-900 text-[15px]">{title}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-bold uppercase">
                        Thể loại &amp; Địa điểm:
                      </span>
                      <span className="font-medium text-slate-800">
                        {category} • {venueName}, {city}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-bold uppercase">
                        Thời gian biểu diễn:
                      </span>
                      <span className="font-medium text-slate-800">
                        {new Date(eventDate).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-400 block text-[11px] font-bold uppercase">
                        Mẫu sơ đồ khán đài:
                      </span>
                      <span className="font-extrabold text-primary text-[15px]">
                        {selectedTemplate.title}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-bold uppercase">
                        Quy mô phát hành:
                      </span>
                      <span className="font-medium text-slate-800">
                        {totalCapacity.toLocaleString("vi-VN")} vé trên {zones.length} khu vực
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-bold uppercase">
                        Doanh thu ước tính tối đa:
                      </span>
                      <span className="font-extrabold text-emerald-700 text-[15px]">
                        {formatVnd(projectedRevenue)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-[12px] bg-blue-50 border border-blue-200 text-blue-900 text-[12px] flex items-start gap-3">
                  <Info className="size-4.5 text-blue-600 shrink-0 mt-0.5" />
                  <p>
                    Sau khi nhấn <strong>Xuất bản sự kiện</strong>, hệ thống TicketHub sẽ tự động phân bổ số lượng vé cho từng khu vực khán đài và kích hoạt hệ thống điều phối lưu lượng chống nghẽn khi mở bán.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-2 px-5 h-11 rounded-[10px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-bold transition-colors"
                  >
                    <ArrowLeft className="size-4" />
                    Quay lại chỉnh giá
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmitEvent}
                    className="inline-flex items-center gap-2 px-7 h-11 rounded-[10px] bg-primary hover:bg-emerald-700 disabled:opacity-50 text-white text-[13px] font-bold transition-colors shadow-xs"
                  >
                    {isSubmitting ? "Đang xuất bản..." : "Xác nhận & Xuất bản sự kiện"}
                    <CheckCircle2 className="size-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewEventOrganizerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Đang tải biểu mẫu...</div>}>
      <NewEventContent />
    </Suspense>
  );
}
