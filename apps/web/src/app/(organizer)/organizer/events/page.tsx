"use client";

import { useState, useMemo, useEffect, useRef, Suspense, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  X,
  CheckCircle2,
  Clock,
  FileText,
  PauseCircle,
  XCircle,
  CheckCheck,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Calendar,
  Eye,
  Copy,
  Edit,
  Pause,
  Trash2,
  RefreshCw,
  Ticket,
  DollarSign,
  Layers,
} from "lucide-react";
import { EventStatus } from "@tickethub/shared";
import {
  MOCK_ORGANIZER_EVENTS,
  type OrganizerEventItem,
  formatVnd,
  formatDateTimeVi,
  formatDateVi,
  formatNumberVi,
  publishOrganizerEvent,
  pauseOrganizerEvent,
  cancelOrganizerEvent,
  cloneOrganizerEvent,
} from "@/lib/organizer-service";

// Vietnamese status definitions matching contract
const STATUS_META: Record<
  EventStatus,
  {
    label: string;
    icon: typeof CheckCircle2;
    badgeClass: string;
  }
> = {
  [EventStatus.PUBLISHED]: {
    label: "Đang mở bán",
    icon: CheckCircle2,
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  [EventStatus.DRAFT]: {
    label: "Bản nháp",
    icon: FileText,
    badgeClass: "bg-secondary text-muted-foreground border-border",
  },
  [EventStatus.PENDING_APPROVAL]: {
    label: "Chờ duyệt",
    icon: Clock,
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  [EventStatus.SUSPENDED]: {
    label: "Tạm dừng",
    icon: PauseCircle,
    badgeClass: "bg-orange-50 text-orange-800 border-orange-200",
  },
  [EventStatus.ENDED]: {
    label: "Đã kết thúc",
    icon: CheckCheck,
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
  [EventStatus.CANCELLED]: {
    label: "Đã hủy",
    icon: XCircle,
    badgeClass: "bg-red-50 text-destructive border-red-200",
  },
};

const CITIES = [
  { value: "ALL", label: "Tất cả thành phố" },
  { value: "TP. Hồ Chí Minh", label: "TP. Hồ Chí Minh" },
  { value: "Hà Nội", label: "Hà Nội" },
  { value: "Đà Nẵng", label: "Đà Nẵng" },
];

const SORT_OPTIONS = [
  { value: "date_asc", label: "Ngày diễn ra (sớm nhất trước)" },
  { value: "date_desc", label: "Ngày diễn ra (muộn nhất trước)" },
  { value: "title_asc", label: "Tên sự kiện (A - Z)" },
  { value: "revenue_desc", label: "Doanh thu (cao nhất)" },
  { value: "sold_desc", label: "Vé đã bán (nhiều nhất)" },
];

type PreviewState = "NORMAL" | "LOADING" | "EMPTY" | "ERROR";

function OrganizerEventsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state synchronization
  const querySearch = searchParams.get("search") || "";
  const queryStatus = searchParams.get("status") || "ALL";
  const queryCity = searchParams.get("city") || "ALL";
  const querySort = searchParams.get("sort") || "date_asc";
  const queryFrom = searchParams.get("from") || "";
  const queryTo = searchParams.get("to") || "";
  const queryPage = parseInt(searchParams.get("page") || "1", 10);

  // Local filter states initialized from URL
  const [searchInput, setSearchInput] = useState(querySearch);
  const [selectedStatus, setSelectedStatus] = useState<string>(queryStatus);
  const [selectedCity, setSelectedCity] = useState<string>(queryCity);
  const [selectedSort, setSelectedSort] = useState<string>(querySort);
  const [fromDate, setFromDate] = useState<string>(queryFrom);
  const [toDate, setToDate] = useState<string>(queryTo);
  const [currentPage, setCurrentPage] = useState<number>(queryPage);

  // State preview switcher for testing
  const [previewState, setPreviewState] = useState<PreviewState>("NORMAL");

  // Active row dropdown state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // Sync state to URL params
  const updateUrlParams = useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || value === "ALL") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  // Sync external search input after typing debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== querySearch) {
        setCurrentPage(1);
        updateUrlParams({ search: searchInput, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, querySearch, updateUrlParams]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(e.target as Node)
      ) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute Summary Strip Metrics
  // // TODO(contract): Replace with GET /api/v1/organizer/metrics
  const metrics = useMemo(() => {
    const all = MOCK_ORGANIZER_EVENTS;
    const totalSold = all.reduce((sum, e) => sum + e.ticketsSold, 0);
    const totalRevenue = all.reduce((sum, e) => sum + e.revenue, 0);
    // Use fixed reference date to ensure pure render
    const referenceTimestamp = new Date("2026-11-01T00:00:00Z").getTime();
    const upcomingCount = all.filter(
      (e) =>
        e.status === EventStatus.PUBLISHED &&
        new Date(e.startTime).getTime() >= referenceTimestamp
    ).length;
    const actionRequiredCount = all.filter(
      (e) =>
        e.status === EventStatus.DRAFT ||
        e.status === EventStatus.PENDING_APPROVAL ||
        e.status === EventStatus.SUSPENDED
    ).length;

    return {
      totalSold,
      totalRevenue,
      upcomingCount,
      actionRequiredCount,
    };
  }, []);

  // Filtered & Sorted Events
  // // TODO(contract): Replace with GET /api/v1/organizer/events query params
  const filteredEvents = useMemo(() => {
    if (previewState === "EMPTY") return [];

    let list = [...MOCK_ORGANIZER_EVENTS];

    // Search query
    if (searchInput.trim()) {
      const q = searchInput.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.venueName.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (selectedStatus === "ACTION_REQUIRED") {
      list = list.filter(
        (e) =>
          e.status === EventStatus.DRAFT ||
          e.status === EventStatus.PENDING_APPROVAL ||
          e.status === EventStatus.SUSPENDED
      );
    } else if (selectedStatus !== "ALL") {
      list = list.filter((e) => e.status === selectedStatus);
    }

    // City filter
    if (selectedCity !== "ALL") {
      list = list.filter((e) => e.city === selectedCity);
    }

    // Date range filter
    if (fromDate) {
      const t = new Date(fromDate).getTime();
      list = list.filter((e) => new Date(e.startTime).getTime() >= t);
    }
    if (toDate) {
      const t = new Date(toDate).getTime();
      list = list.filter((e) => new Date(e.startTime).getTime() <= t);
    }

    // Sorting
    list.sort((a, b) => {
      switch (selectedSort) {
        case "date_asc":
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        case "date_desc":
          return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        case "title_asc":
          return a.title.localeCompare(b.title, "vi");
        case "revenue_desc":
          return b.revenue - a.revenue;
        case "sold_desc":
          return b.ticketsSold - a.ticketsSold;
        default:
          return 0;
      }
    });

    return list;
  }, [
    previewState,
    searchInput,
    selectedStatus,
    selectedCity,
    selectedSort,
    fromDate,
    toDate,
  ]);

  // Pagination (20 per page per API contract)
  const pageSize = 20;
  const totalItems = filteredEvents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [filteredEvents, currentPage]);

  // Handle Summary Strip Filter Click
  const handleSummaryStripClick = (type: "SOLD" | "REVENUE" | "UPCOMING" | "ACTION") => {
    setCurrentPage(1);
    switch (type) {
      case "SOLD":
        setSelectedStatus("PUBLISHED");
        updateUrlParams({ status: "PUBLISHED", page: 1 });
        break;
      case "REVENUE":
        setSelectedSort("revenue_desc");
        updateUrlParams({ sort: "revenue_desc", page: 1 });
        break;
      case "UPCOMING":
        setSelectedStatus("PUBLISHED");
        setSelectedSort("date_asc");
        updateUrlParams({ status: "PUBLISHED", sort: "date_asc", page: 1 });
        break;
      case "ACTION":
        setSelectedStatus("ACTION_REQUIRED");
        updateUrlParams({ status: "ACTION_REQUIRED", page: 1 });
        break;
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput("");
    setSelectedStatus("ALL");
    setSelectedCity("ALL");
    setSelectedSort("date_asc");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
    router.replace(pathname, { scroll: false });
  };

  const hasActiveFilters =
    Boolean(searchInput) ||
    selectedStatus !== "ALL" ||
    selectedCity !== "ALL" ||
    selectedSort !== "date_asc" ||
    Boolean(fromDate) ||
    Boolean(toDate);

  // Quick action context-aware handler
  const handleQuickAction = async (e: React.MouseEvent, event: OrganizerEventItem) => {
    e.stopPropagation();
    if (event.status === EventStatus.DRAFT) {
      // TODO(contract): POST /api/v1/events/:id/publish
      await publishOrganizerEvent(event.id);
      setSelectedStatus("ALL");
    } else if (event.status === EventStatus.PUBLISHED) {
      router.push(`/events/${event.slug}`);
    } else if (event.status === EventStatus.ENDED) {
      router.push(`/events/${event.slug}`);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* 1. Header: Calm & task-oriented, no duplicate page CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sự kiện
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý và theo dõi hiệu suất phát hành vé các sự kiện của bạn.
          </p>
        </div>

        {/* State Preview Switcher for dev verification */}
        <div className="flex items-center gap-1.5 p-1 rounded-md border border-border bg-background text-xs">
          <span className="px-2 py-1 text-muted-foreground font-medium hidden md:inline">
            Xem trước:
          </span>
          <button
            type="button"
            onClick={() => setPreviewState("NORMAL")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              previewState === "NORMAL"
                ? "bg-secondary text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Bình thường
          </button>
          <button
            type="button"
            onClick={() => setPreviewState("LOADING")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              previewState === "LOADING"
                ? "bg-secondary text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Đang tải
          </button>
          <button
            type="button"
            onClick={() => setPreviewState("EMPTY")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              previewState === "EMPTY"
                ? "bg-secondary text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Trống
          </button>
          <button
            type="button"
            onClick={() => setPreviewState("ERROR")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              previewState === "ERROR"
                ? "bg-secondary text-destructive font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Lỗi API
          </button>
        </div>
      </div>

      {/* 2. Compact Summary Strip (Replaces 4 stat cards, clickable filter triggers) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Vé đã bán */}
        <button
          type="button"
          onClick={() => handleSummaryStripClick("SOLD")}
          className={`p-3 sm:p-3.5 rounded-lg border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            selectedStatus === "PUBLISHED" && selectedSort !== "revenue_desc"
              ? "border-primary bg-accent/40"
              : "border-border bg-background hover:bg-secondary/40"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Vé đã bán</span>
            <Ticket className="size-3.5 text-muted-foreground" />
          </div>
          <div className="text-sm sm:text-lg lg:text-xl font-bold tracking-tight text-foreground mt-1 tabular-nums truncate">
            {formatNumberVi(metrics.totalSold)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            Xem sự kiện đang mở bán
          </p>
        </button>

        {/* Doanh thu */}
        <button
          type="button"
          onClick={() => handleSummaryStripClick("REVENUE")}
          className={`p-3 sm:p-3.5 rounded-lg border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            selectedSort === "revenue_desc"
              ? "border-primary bg-accent/40"
              : "border-border bg-background hover:bg-secondary/40"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Doanh thu</span>
            <DollarSign className="size-3.5 text-muted-foreground" />
          </div>
          <div className="text-sm sm:text-lg lg:text-xl font-bold tracking-tight text-foreground mt-1 tabular-nums whitespace-nowrap truncate">
            {formatVnd(metrics.totalRevenue)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            Sắp xếp theo doanh thu cao
          </p>
        </button>

        {/* Sắp diễn ra */}
        <button
          type="button"
          onClick={() => handleSummaryStripClick("UPCOMING")}
          className={`p-3 sm:p-3.5 rounded-lg border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            selectedStatus === "PUBLISHED" && selectedSort === "date_asc"
              ? "border-primary bg-accent/40"
              : "border-border bg-background hover:bg-secondary/40"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Sắp diễn ra</span>
            <Calendar className="size-3.5 text-muted-foreground" />
          </div>
          <div className="text-sm sm:text-lg lg:text-xl font-bold tracking-tight text-foreground mt-1 tabular-nums truncate">
            {metrics.upcomingCount} sự kiện
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            Sắp xếp theo ngày gần nhất
          </p>
        </button>

        {/* Cần xử lý */}
        <button
          type="button"
          onClick={() => handleSummaryStripClick("ACTION")}
          className={`p-3 sm:p-3.5 rounded-lg border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            selectedStatus === "ACTION_REQUIRED"
              ? "border-primary bg-accent/40"
              : "border-border bg-background hover:bg-secondary/40"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Cần xử lý</span>
            <AlertCircle className="size-3.5 text-muted-foreground" />
          </div>
          <div className="text-sm sm:text-lg lg:text-xl font-bold tracking-tight text-foreground mt-1 tabular-nums truncate">
            {metrics.actionRequiredCount} sự kiện
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            Bản nháp &amp; chờ duyệt
          </p>
        </button>
      </div>

      {/* 3. Toolbar: Search, Filters, Sorting, Active Filter Chips */}
      <div className="bg-background rounded-lg border border-border p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên sự kiện, địa điểm, thành phố..."
              className="w-full h-10 pl-9 pr-8 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label="Xóa từ khóa tìm kiếm"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter (matching contract enums only) */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
                updateUrlParams({ status: e.target.value, page: 1 });
              }}
              aria-label="Lọc theo trạng thái"
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTION_REQUIRED">Cần xử lý (Nháp/Chờ duyệt)</option>
              <option value={EventStatus.PUBLISHED}>Đang mở bán</option>
              <option value={EventStatus.DRAFT}>Bản nháp</option>
              <option value={EventStatus.PENDING_APPROVAL}>Chờ duyệt</option>
              <option value={EventStatus.SUSPENDED}>Tạm dừng</option>
              <option value={EventStatus.ENDED}>Đã kết thúc</option>
              <option value={EventStatus.CANCELLED}>Đã hủy</option>
            </select>
          </div>

          {/* City Filter */}
          <div>
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setCurrentPage(1);
                updateUrlParams({ city: e.target.value, page: 1 });
              }}
              aria-label="Lọc theo thành phố"
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              {CITIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selection */}
          <div>
            <select
              value={selectedSort}
              onChange={(e) => {
                setSelectedSort(e.target.value);
                updateUrlParams({ sort: e.target.value });
              }}
              aria-label="Sắp xếp danh sách"
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range Inputs */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border text-xs text-muted-foreground">
          <span className="font-medium">Khoảng ngày:</span>
          <div className="flex items-center gap-2">
            <label htmlFor="from-date" className="sr-only">
              Từ ngày
            </label>
            <input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setCurrentPage(1);
                updateUrlParams({ from: e.target.value, page: 1 });
              }}
              className="h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span>đến</span>
            <label htmlFor="to-date" className="sr-only">
              Đến ngày
            </label>
            <input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setCurrentPage(1);
                updateUrlParams({ to: e.target.value, page: 1 });
              }}
              className="h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 ml-auto">
              {searchInput && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary text-foreground text-xs font-medium">
                  Từ khóa: &quot;{searchInput}&quot;
                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    aria-label="Xóa từ khóa"
                    className="hover:text-destructive cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {selectedStatus !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary text-foreground text-xs font-medium">
                  Trạng thái:{" "}
                  {selectedStatus === "ACTION_REQUIRED"
                    ? "Cần xử lý"
                    : STATUS_META[selectedStatus as EventStatus]?.label ||
                      selectedStatus}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStatus("ALL");
                      updateUrlParams({ status: null });
                    }}
                    aria-label="Xóa lọc trạng thái"
                    className="hover:text-destructive cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {selectedCity !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary text-foreground text-xs font-medium">
                  {selectedCity}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCity("ALL");
                      updateUrlParams({ city: null });
                    }}
                    aria-label="Xóa lọc thành phố"
                    className="hover:text-destructive cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {(fromDate || toDate) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary text-foreground text-xs font-medium">
                  {fromDate ? formatDateVi(fromDate) : "..."} -{" "}
                  {toDate ? formatDateVi(toDate) : "..."}
                  <button
                    type="button"
                    onClick={() => {
                      setFromDate("");
                      setToDate("");
                      updateUrlParams({ from: null, to: null });
                    }}
                    aria-label="Xóa lọc ngày"
                    className="hover:text-destructive cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-primary hover:underline font-semibold ml-1 cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Data Table / State Views */}
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        {/* Loading Skeleton State */}
        {previewState === "LOADING" && (
          <div className="p-6 space-y-4" role="status" aria-label="Đang tải dữ liệu sự kiện">
            <div className="h-4 bg-secondary rounded w-48 animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3.5 rounded-md border border-border/50 animate-pulse gap-4"
                >
                  <div className="flex items-center gap-3 w-1/3">
                    <div className="size-11 rounded-md bg-secondary shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-secondary rounded w-3/4" />
                      <div className="h-3 bg-secondary rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-4 bg-secondary rounded w-1/5" />
                  <div className="h-4 bg-secondary rounded w-1/6" />
                  <div className="h-4 bg-secondary rounded w-1/8" />
                  <div className="h-8 bg-secondary rounded w-20" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Error State (matching contract error shape) */}
        {previewState === "ERROR" && (
          <div className="p-12 text-center space-y-3" role="alert">
            <div className="size-12 rounded-full bg-red-50 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle className="size-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-foreground">
                Không thể tải danh sách sự kiện
              </h3>
              <p className="text-xs text-muted-foreground">
                Máy chủ trả về mã lỗi{" "}
                <code className="font-mono text-destructive">
                  INTERNAL_SERVER_ERROR (HTTP 500)
                </code>
                . Vui lòng kiểm tra kết nối mạng hoặc thử lại sau giây lát.
              </p>
              <p className="text-[11px] text-muted-foreground font-mono">
                Mã yêu cầu: req_01HZX890ABCDEF • {new Date().toISOString()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPreviewState("NORMAL")}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <RefreshCw className="size-3.5" />
              <span>Thử lại</span>
            </button>
          </div>
        )}

        {/* Empty List State (Zero events in account) */}
        {previewState === "NORMAL" && filteredEvents.length === 0 && !hasActiveFilters && (
          <div className="p-12 text-center space-y-3">
            <div className="size-12 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
              <Calendar className="size-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-bold text-foreground">
                Chưa có sự kiện nào
              </h3>
              <p className="text-xs text-muted-foreground">
                Bạn chưa khởi tạo sự kiện nào trên TicketHub. Hãy bắt đầu bằng cách tạo sự kiện đầu tiên.
              </p>
            </div>
            <Link
              href="/organizer/events/new"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              Tạo sự kiện ngay
            </Link>
          </div>
        )}

        {/* No Results State (Filters produced empty result) */}
        {previewState === "NORMAL" && filteredEvents.length === 0 && hasActiveFilters && (
          <div className="p-12 text-center space-y-3">
            <div className="size-12 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
              <Search className="size-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-bold text-foreground">
                Không tìm thấy sự kiện phù hợp
              </h3>
              <p className="text-xs text-muted-foreground">
                Không có sự kiện nào khớp với các bộ lọc bạn đã chọn. Vui lòng thử từ khóa khác hoặc xóa bộ lọc.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-border bg-background text-xs font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}

        {/* Normal Data Table */}
        {previewState === "NORMAL" && paginatedEvents.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                  <th scope="col" className="py-3 px-4 min-w-[280px]">
                    Sự kiện
                  </th>
                  <th scope="col" className="py-3 px-4 min-w-[180px]">
                    Địa điểm
                  </th>
                  <th scope="col" className="py-3 px-4 min-w-[160px]">
                    Vé đã bán
                  </th>
                  <th scope="col" className="py-3 px-4 min-w-[140px] text-right">
                    Doanh thu
                  </th>
                  <th scope="col" className="py-3 px-4 min-w-[130px]">
                    Trạng thái
                  </th>
                  <th scope="col" className="py-3 px-4 min-w-[150px] text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedEvents.map((event) => {
                  const statusInfo =
                    STATUS_META[event.status] || STATUS_META[EventStatus.DRAFT];
                  const StatusIcon = statusInfo.icon;
                  const soldPercent =
                    event.ticketsTotal > 0
                      ? Math.min(
                          100,
                          Math.round((event.ticketsSold / event.ticketsTotal) * 100)
                        )
                      : 0;

                  return (
                    <tr
                      key={event.id}
                      onClick={() => router.push(`/events/${event.slug}`)}
                      className="hover:bg-secondary/40 transition-colors cursor-pointer group"
                    >
                      {/* Sự kiện (Thumbnail, Name with tooltip, Date/Time) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative size-12 rounded-md overflow-hidden bg-secondary border border-border shrink-0">
                            {event.bannerUrl ? (
                              <Image
                                src={event.bannerUrl}
                                alt=""
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="size-full flex items-center justify-center text-muted-foreground">
                                <Calendar className="size-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4
                              className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate"
                              title={event.title}
                            >
                              {event.title}
                            </h4>
                            <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                              {formatDateTimeVi(event.startTime)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Địa điểm (Venue + City) */}
                      <td className="py-3.5 px-4">
                        <p className="text-xs font-medium text-foreground truncate" title={event.venueName}>
                          {event.venueName}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {event.city}
                        </p>
                      </td>

                      {/* Vé đã bán (Progress bar + Tabular counts) */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                            <span className="font-semibold text-foreground">
                              {formatNumberVi(event.ticketsSold)}
                            </span>
                            <span className="text-muted-foreground">
                              / {formatNumberVi(event.ticketsTotal)} ({soldPercent}%)
                            </span>
                          </div>
                          <div
                            className="h-1.5 w-full bg-secondary rounded-full overflow-hidden"
                            role="progressbar"
                            aria-valuenow={soldPercent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${soldPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Doanh thu (Tabular Currency) */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-foreground whitespace-nowrap tabular-nums">
                          {formatVnd(event.revenue)}
                        </span>
                      </td>

                      {/* Trạng thái (Pill with icon and semantic token border/bg) */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap ${statusInfo.badgeClass}`}
                        >
                          <StatusIcon className="size-3" />
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      {/* Actions: At most one visible quick action + ⋯ menu */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* Context-aware quick action button */}
                          {event.status === EventStatus.DRAFT && (
                            <button
                              type="button"
                              onClick={(e) => handleQuickAction(e, event)}
                              className="h-8 px-2.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
                            >
                              Phát hành
                            </button>
                          )}
                          {event.status === EventStatus.PUBLISHED && (
                            <button
                              type="button"
                              onClick={(e) => handleQuickAction(e, event)}
                              className="h-8 px-2.5 rounded-md border border-border bg-background hover:bg-secondary text-foreground text-xs font-medium whitespace-nowrap transition-colors cursor-pointer"
                            >
                              Xem doanh số
                            </button>
                          )}
                          {event.status === EventStatus.ENDED && (
                            <button
                              type="button"
                              onClick={(e) => handleQuickAction(e, event)}
                              className="h-8 px-2.5 rounded-md border border-border bg-background hover:bg-secondary text-foreground text-xs font-medium whitespace-nowrap transition-colors cursor-pointer"
                            >
                              Xem báo cáo
                            </button>
                          )}

                          {/* Secondary actions "⋯" dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              aria-label={`Tùy chọn cho sự kiện ${event.title}`}
                              aria-haspopup="true"
                              aria-expanded={activeMenuId === event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId((curr) =>
                                  curr === event.id ? null : event.id
                                );
                              }}
                              className="size-8 rounded-md border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <MoreHorizontal className="size-4" />
                            </button>

                            {activeMenuId === event.id && (
                              <div
                                ref={menuContainerRef}
                                role="menu"
                                className="absolute right-0 mt-1 w-48 rounded-md border border-border bg-popover text-popover-foreground shadow-lg py-1 z-30 text-left text-xs"
                              >
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(null);
                                    router.push(`/events/${event.slug}`);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary text-foreground transition-colors cursor-pointer"
                                >
                                  <Eye className="size-3.5 text-muted-foreground" />
                                  <span>Xem chi tiết</span>
                                </button>

                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(null);
                                    router.push(`/events/${event.slug}`);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary text-foreground transition-colors cursor-pointer"
                                >
                                  <Layers className="size-3.5 text-muted-foreground" />
                                  <span>Xem sơ đồ chỗ ngồi</span>
                                </button>

                                {(event.status === EventStatus.DRAFT ||
                                  event.status === EventStatus.PENDING_APPROVAL ||
                                  event.status === EventStatus.PUBLISHED) && (
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(null);
                                      router.push(`/organizer/events/new?edit=${event.id}`);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary text-foreground transition-colors cursor-pointer"
                                  >
                                    <Edit className="size-3.5 text-muted-foreground" />
                                    <span>Chỉnh sửa</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(null);
                                    // TODO(contract): POST /api/v1/events/:id/clone
                                    await cloneOrganizerEvent(event.id);
                                    router.refresh();
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary text-foreground transition-colors cursor-pointer"
                                >
                                  <Copy className="size-3.5 text-muted-foreground" />
                                  <span>Nhân bản</span>
                                </button>

                                {event.status === EventStatus.PUBLISHED && (
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(null);
                                      // TODO(contract): POST /api/v1/events/:id/pause
                                      await pauseOrganizerEvent(event.id);
                                      router.refresh();
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary text-orange-700 transition-colors cursor-pointer"
                                  >
                                    <Pause className="size-3.5" />
                                    <span>Tạm dừng bán</span>
                                  </button>
                                )}

                                {(event.status === EventStatus.PUBLISHED ||
                                  event.status === EventStatus.PENDING_APPROVAL) && (
                                  <div className="border-t border-border mt-1 pt-1">
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        setActiveMenuId(null);
                                        // TODO(contract): POST /api/v1/events/:id/cancel
                                        await cancelOrganizerEvent(event.id);
                                        router.refresh();
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="size-3.5" />
                                      <span>Hủy sự kiện</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Pagination Bar (20 per page matching contract) */}
        {previewState === "NORMAL" && filteredEvents.length > 0 && (
          <div className="p-3.5 border-t border-border bg-background flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>
              Hiển thị{" "}
              <strong className="text-foreground tabular-nums">
                {(currentPage - 1) * pageSize + 1}
              </strong>{" "}
              -{" "}
              <strong className="text-foreground tabular-nums">
                {Math.min(currentPage * pageSize, totalItems)}
              </strong>{" "}
              trên tổng số{" "}
              <strong className="text-foreground tabular-nums">
                {totalItems}
              </strong>{" "}
              sự kiện (20 / trang)
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => {
                  const p = Math.max(1, currentPage - 1);
                  setCurrentPage(p);
                  updateUrlParams({ page: p });
                }}
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md border border-border bg-background hover:bg-secondary text-foreground text-xs disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
                <span>Trang trước</span>
              </button>

              <span className="px-2 font-mono tabular-nums text-foreground">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => {
                  const p = Math.min(totalPages, currentPage + 1);
                  setCurrentPage(p);
                  updateUrlParams({ page: p });
                }}
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md border border-border bg-background hover:bg-secondary text-foreground text-xs disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <span>Trang sau</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrganizerEventsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1200px] mx-auto px-4 py-8 text-xs text-muted-foreground">
          Đang tải trang sự kiện...
        </div>
      }
    >
      <OrganizerEventsContent />
    </Suspense>
  );
}
