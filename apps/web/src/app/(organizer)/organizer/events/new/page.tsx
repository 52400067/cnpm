"use client";

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Info,
  MapPin,
  Search,
  Building2,
  Check,
  Compass,
} from "lucide-react";
import { SeatMap } from "@/components/events/seat-map";
import { type VenueMapKey } from "@/lib/venue-svg.generated";
import { formatVnd } from "@/lib/events-catalog";
import {
  CURATED_VENUES,
  CURATED_LAYOUT_TEMPLATES,
  type VietnamCity,
  type VenueCategory,
  type CuratedVenue,
  type CuratedZoneConfig,
} from "@/lib/curated-venues";

const CITY_FILTERS: Array<{ id: VietnamCity | "ALL"; label: string }> = [
  { id: "ALL", label: "Tất cả thành phố" },
  { id: "TP. Hồ Chí Minh", label: "TP. Hồ Chí Minh (4)" },
  { id: "Hà Nội", label: "Hà Nội (4)" },
  { id: "Đà Nẵng", label: "Đà Nẵng (3)" },
];

const CATEGORY_FILTERS: Array<{ id: VenueCategory | "ALL"; label: string }> = [
  { id: "ALL", label: "Tất cả danh mục" },
  { id: "stadium", label: "Sân vận động" },
  { id: "arena", label: "Nhà thi đấu" },
  { id: "theater", label: "Nhà hát" },
  { id: "sports", label: "Thể thao" },
];

function NewEventContent() {
  const searchParams = useSearchParams();
  const initialStep = Math.min(4, Math.max(1, parseInt(searchParams.get("step") ?? "1", 10) || 1)) as 1 | 2 | 3 | 4;
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialStep);

  // Curated Venue Filtering State
  const [selectedCity, setSelectedCity] = useState<VietnamCity | "ALL">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<VenueCategory | "ALL">("ALL");
  const [venueSearchQuery, setVenueSearchQuery] = useState("");
  const [selectedVenueId, setSelectedVenueId] = useState<string>("vn-hn-dien-kinh");

  // Step 1: Event Basic Info
  const [title, setTitle] = useState("Live Concert Mùa Thu Hà Nội");
  const [category, setCategory] = useState("Âm nhạc");
  const [venueName, setVenueName] = useState("Cung Thể Thao Điền Kinh Trong Nhà Hà Nội");
  const [venueAddress, setVenueAddress] = useState("Đường Trần Hữu Dực, Phường Cầu Diễn, Quận Nam Từ Liêm, Hà Nội");
  const [city, setCity] = useState("Hà Nội");
  const [eventDate, setEventDate] = useState("2027-11-20T19:30");

  // Step 2: Venue Layout Template
  const [selectedLayoutKey, setSelectedLayoutKey] = useState<VenueMapKey>("arena-t-stage");
  const [showAllLayouts, setShowAllLayouts] = useState(false);

  // Currently selected venue object
  const currentVenue = useMemo<CuratedVenue | undefined>(
    () => CURATED_VENUES.find((v) => v.id === selectedVenueId),
    [selectedVenueId]
  );

  // Filtered venues based on City, Category, Search Query
  const filteredVenues = useMemo(() => {
    return CURATED_VENUES.filter((venue) => {
      const matchCity = selectedCity === "ALL" || venue.city === selectedCity;
      const matchCategory = selectedCategory === "ALL" || venue.category === selectedCategory;
      const matchSearch =
        venueSearchQuery.trim() === "" ||
        venue.name.toLowerCase().includes(venueSearchQuery.toLowerCase()) ||
        venue.shortName.toLowerCase().includes(venueSearchQuery.toLowerCase()) ||
        venue.district.toLowerCase().includes(venueSearchQuery.toLowerCase()) ||
        venue.address.toLowerCase().includes(venueSearchQuery.toLowerCase()) ||
        venue.featuredEvents.toLowerCase().includes(venueSearchQuery.toLowerCase());

      return matchCity && matchCategory && matchSearch;
    });
  }, [selectedCity, selectedCategory, venueSearchQuery]);

  // Current layout template
  const currentLayoutTemplate = useMemo(() => {
    return CURATED_LAYOUT_TEMPLATES[selectedLayoutKey] ?? CURATED_LAYOUT_TEMPLATES["arena-t-stage"];
  }, [selectedLayoutKey]);

  // Step 3: Zone Pricing & Capacity
  const [zones, setZones] = useState<CuratedZoneConfig[]>(
    CURATED_LAYOUT_TEMPLATES["arena-t-stage"].defaultZones
  );
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  // Handle selecting a curated venue card
  const handleSelectCuratedVenue = (venue: CuratedVenue) => {
    setSelectedVenueId(venue.id);
    setVenueName(venue.name);
    setVenueAddress(venue.address);
    setCity(venue.city);

    // Pick first layout of this curated venue
    const firstLayout = venue.layouts[0] ?? CURATED_LAYOUT_TEMPLATES["arena-t-stage"];
    setSelectedLayoutKey(firstLayout.mapKey);
    setZones(firstLayout.defaultZones);
    setActiveZoneId(null);
  };

  // Handle switching layout template
  const handleSelectLayout = (mapKey: VenueMapKey) => {
    setSelectedLayoutKey(mapKey);
    const tmpl = CURATED_LAYOUT_TEMPLATES[mapKey] ?? CURATED_LAYOUT_TEMPLATES["arena-t-stage"];
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-slate-900">
              Tạo sự kiện &amp; Chọn Địa điểm Chuẩn (Curated Venues)
            </h1>
            <p className="text-[14px] text-slate-500">
              Chọn địa điểm thực tế tại TP. Hồ Chí Minh, Hà Nội, Đà Nẵng với sơ đồ khán đài SVG đã được kiểm duyệt.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[12px] font-bold self-start">
            <CheckCircle2 className="size-4 text-emerald-600" />
            3 Thành phố hỗ trợ
          </span>
        </div>
      </div>

      {/* Stepper Progress Indicator */}
      <div className="grid grid-cols-4 gap-2 border-b border-slate-200 pb-4">
        {[
          { num: 1, title: "1. Địa điểm & Thông tin" },
          { num: 2, title: "2. Chọn mẫu sơ đồ SVG" },
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

      {/* STEP 1: Curated Venue Picker & Event Details */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Curated Venues Section */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-[18px] font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="size-5 text-primary" />
                  Chọn địa điểm tiêu chuẩn đã kiểm duyệt (Curated Venues)
                </h2>
                <p className="text-[13px] text-slate-500">
                  Hệ thống TicketHub hỗ trợ sẵn 11 địa điểm tổ chức biểu diễn và thi đấu lớn nhất tại 3 thành phố trọng điểm.
                </p>
              </div>
              {currentVenue && (
                <div className="px-3.5 py-1.5 rounded-[8px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] font-semibold flex items-center gap-1.5">
                  <Check className="size-4 text-emerald-600" />
                  <span>Đang chọn: <strong>{currentVenue.shortName}</strong></span>
                </div>
              )}
            </div>

            {/* City Tabs Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {CITY_FILTERS.map((tab) => {
                const isSelected = selectedCity === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedCity(tab.id)}
                    className={`px-4 py-2 rounded-[10px] text-[13px] font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? "bg-primary text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search and Category Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 relative">
                <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={venueSearchQuery}
                  onChange={(e) => setVenueSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên sân, quận huyện, địa chỉ (VD: Mỹ Đình, Quân Khu 7, Hòa Xuân)..."
                  className="w-full h-10.5 pl-10 pr-4 rounded-[10px] border border-slate-200 text-slate-900 text-[13px] font-medium placeholder:text-slate-400 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as VenueCategory | "ALL")}
                  className="w-full h-10.5 px-3.5 rounded-[10px] border border-slate-200 text-slate-900 text-[13px] font-medium bg-white focus:outline-none focus:border-primary"
                >
                  {CATEGORY_FILTERS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Curated Venues Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
              {filteredVenues.length === 0 ? (
                <div className="col-span-full py-10 text-center text-slate-500 text-[13px]">
                  Không tìm thấy địa điểm phù hợp trong bộ lọc hiện tại. Vui lòng thử tìm kiếm khác hoặc chuyển thành phố.
                </div>
              ) : (
                filteredVenues.map((v) => {
                  const isSelected = v.id === selectedVenueId;
                  return (
                    <div
                      key={v.id}
                      onClick={() => handleSelectCuratedVenue(v)}
                      className={`cursor-pointer rounded-[14px] border overflow-hidden transition-all text-left flex flex-col ${
                        isSelected
                          ? "border-primary bg-emerald-50/40 ring-2 ring-primary shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs"
                      }`}
                    >
                      {/* Image header with category pill */}
                      <div className="relative h-28 bg-slate-100 overflow-hidden shrink-0">
                        <Image
                          src={v.thumbnailUrl}
                          alt={v.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-[6px] bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                            {v.categoryLabel}
                          </span>
                        </div>
                        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px] font-semibold">
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3 text-emerald-400" />
                            {v.city}
                          </span>
                          <span className="text-white/90">
                            {v.totalCapacity}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-start justify-between gap-1.5">
                            <h3 className="font-extrabold text-slate-900 text-[14px] leading-tight line-clamp-1">
                              {v.name}
                            </h3>
                            {isSelected && (
                              <span className="p-0.5 rounded-full bg-primary text-white shrink-0 mt-0.5">
                                <Check className="size-3" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {v.district} • {v.address}
                          </p>
                          <p className="text-[11px] text-slate-600 mt-1.5 line-clamp-2">
                            {v.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">
                            {v.layouts.length} sơ đồ khán đài SVG
                          </span>
                          <span className={`font-bold ${isSelected ? "text-primary" : "text-slate-700"}`}>
                            {isSelected ? "Đang chọn" : "Nhấn để chọn"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Event Details Form */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-2xs space-y-6">
            <div className="space-y-1">
              <h2 className="text-[18px] font-extrabold text-slate-900">
                Thông tin chương trình &amp; Địa chỉ tổ chức
              </h2>
              <p className="text-[13px] text-slate-500">
                Thông tin bên dưới đã được tự động điền theo địa điểm đã chọn ở trên. Bạn có thể chỉnh sửa nếu có yêu cầu riêng.
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
                  <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
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
                className="inline-flex items-center gap-2 px-6 h-11 rounded-[10px] bg-primary hover:bg-emerald-700 text-white text-[13px] font-bold transition-colors shadow-xs"
              >
                Tiếp tục: Chọn mẫu sơ đồ SVG
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Venue Layout Selector with Interactive SVG Preview */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-[18px] font-extrabold text-slate-900">
                  Bước 2: Chọn mẫu sơ đồ khán đài kiến trúc
                </h2>
                <p className="text-[13px] text-slate-500">
                  {currentVenue
                    ? `Địa điểm đã chọn: ${currentVenue.name} (${currentVenue.city}). Dưới đây là các cấu hình sân khấu tương thích:`
                    : "Chọn mô hình không gian biểu diễn phù hợp với sự kiện của bạn:"}
                </p>
              </div>

              {currentVenue && (
                <button
                  type="button"
                  onClick={() => setShowAllLayouts((prev) => !prev)}
                  className="text-[12px] font-bold text-primary hover:underline flex items-center gap-1 self-start sm:self-auto"
                >
                  <Compass className="size-3.5" />
                  {showAllLayouts ? "Chỉ xem sơ đồ tương thích" : "Xem tất cả 5 mẫu sơ đồ chuẩn"}
                </button>
              )}
            </div>

            {/* Layout Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
              {Object.entries(CURATED_LAYOUT_TEMPLATES)
                .filter(([key]) => {
                  if (showAllLayouts || !currentVenue) return true;
                  return currentVenue.layouts.some((l) => l.mapKey === key);
                })
                .map(([key, tmpl]) => {
                  const isSelected = tmpl.mapKey === selectedLayoutKey;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectLayout(tmpl.mapKey)}
                      className={`p-4 rounded-[12px] border text-left transition-all relative ${
                        isSelected
                          ? "border-primary bg-emerald-50/50 shadow-xs ring-1 ring-primary"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                          {tmpl.categoryName}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="size-4 text-primary shrink-0" />
                        )}
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-[14px]">
                        {tmpl.name}
                      </h3>
                      <p className="text-[12px] text-slate-600 mt-1 line-clamp-2">
                        {tmpl.description}
                      </p>
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[11px] text-slate-500 space-y-1">
                        <div>
                          <span className="font-semibold text-slate-700">Sức chứa ước tính:</span>{" "}
                          {tmpl.capacityEstimate}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700">Số phân khu mặc định:</span>{" "}
                          {tmpl.defaultZones.length} khu vực
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
                  Xem trước trực tiếp: {currentLayoutTemplate.name}
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
                mapKey={selectedLayoutKey}
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
              Quay lại Bước 1
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
                  <strong>{currentLayoutTemplate.name}</strong>.
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
                Hệ thống sẽ tạo tự động toàn bộ vị trí chỗ ngồi, liên kết với sơ đồ khán đài SVG và cấp mã vé điện tử bảo mật.
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
                    Địa điểm <strong>{venueName}</strong> với mẫu sơ đồ <strong>{currentLayoutTemplate.name}</strong> cùng {totalCapacity.toLocaleString("vi-VN")} vé đã được khởi tạo trong hệ thống.
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
                        Địa chỉ chi tiết:
                      </span>
                      <span className="font-medium text-slate-800">
                        {venueAddress}
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
                        Mẫu sơ đồ khán đài SVG:
                      </span>
                      <span className="font-extrabold text-primary text-[15px]">
                        {currentLayoutTemplate.name}
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
                    Sau khi nhấn <strong>Xác nhận &amp; Xuất bản sự kiện</strong>, hệ thống TicketHub sẽ tự động phân bổ số lượng vé cho từng khu vực khán đài trên sơ đồ SVG và kích hoạt hệ thống điều phối lưu lượng chống nghẽn khi mở bán.
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
