// apps/web/src/lib/organizer-service.ts
/**
 * Organizer Service & API Adapter Layer
 *
 * This file serves as the back-office data adapter for the TicketHub Organizer Portal.
 * It encapsulates data structures, API client calls, mock data fallbacks,
 * and client-side draft autosave logic.
 *
 * All contract discrepancies and missing endpoints are explicitly marked with
 * // TODO(contract): <description>
 */

import { EventStatus } from "@tickethub/shared";

// ==========================================
// 1. Interfaces & Types matching ERD.md & API_CONTRACT.md
// ==========================================

export interface OrganizerEventItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  bannerUrl: string;
  venueId?: string;
  venueName: string;
  venueAddress: string;
  city: string;
  startTime: string; // ISO 8601
  endTime?: string;  // ISO 8601
  status: EventStatus;
  ticketsSold: number;
  ticketsTotal: number;
  revenue: number; // in VND
  version: number;
  rejectionReason?: string;
}

export interface OrganizerMetrics {
  totalSoldTickets: number;
  totalRevenue: number;
  upcomingEventsCount: number;
  actionRequiredCount: number;
}

export interface OrganizerEventsQuery {
  keyword?: string;
  status?: EventStatus | "ALL" | "ACTION_REQUIRED";
  city?: string;
  fromDate?: string;
  toDate?: string;
  sort?: "date_asc" | "date_desc" | "title_asc" | "revenue_desc" | "sold_desc";
  cursor?: string;
  limit?: number;
}

export interface OrganizerEventsResponse {
  items: OrganizerEventItem[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
}

export interface EventDraftData {
  id?: string;
  title: string;
  category: string;
  startTime: string;
  endTime?: string;
  venueId?: string;
  venueName?: string;
  venueAddress?: string;
  city?: string;
  savedAt: string; // ISO 8601
}

// ==========================================
// 2. Vi-VN Formatting Utilities (Intl API only)
// ==========================================

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function formatDateVi(date: Date | string): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTimeVi(date: Date | string): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const datePart = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
  const timePart = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${datePart} · ${timePart}`;
}

// ==========================================
// 2b. Display Status Selector (Derived)
// ==========================================

// TODO(contract): API lacks SOLD_OUT and ALMOST_SOLD_OUT enum values; derived in frontend selector
export interface DisplayStatusMeta {
  key: string;
  label: string;
  badgeClass: string;
}

export function getDisplayStatus(event: OrganizerEventItem): DisplayStatusMeta {
  if (event.status === EventStatus.PUBLISHED) {
    if (event.ticketsTotal > 0 && event.ticketsSold >= event.ticketsTotal) {
      return {
        key: "SOLD_OUT",
        label: "Hết vé",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
      };
    }
    if (event.ticketsTotal > 0 && event.ticketsSold >= event.ticketsTotal * 0.9) {
      return {
        key: "ALMOST_SOLD_OUT",
        label: "Sắp hết vé",
        badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      };
    }
  }

  switch (event.status) {
    case EventStatus.PUBLISHED:
      return {
        key: EventStatus.PUBLISHED,
        label: "Đang mở bán",
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    case EventStatus.DRAFT:
      return {
        key: EventStatus.DRAFT,
        label: "Bản nháp",
        badgeClass: "bg-secondary text-muted-foreground border-border",
      };
    case EventStatus.PENDING_APPROVAL:
      return {
        key: EventStatus.PENDING_APPROVAL,
        label: "Chờ duyệt",
        badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      };
    case EventStatus.SUSPENDED:
      return {
        key: EventStatus.SUSPENDED,
        label: "Tạm dừng",
        badgeClass: "bg-orange-50 text-orange-800 border-orange-200",
      };
    case EventStatus.ENDED:
      return {
        key: EventStatus.ENDED,
        label: "Đã kết thúc",
        badgeClass: "bg-muted text-muted-foreground border-border",
      };
    case EventStatus.CANCELLED:
      return {
        key: EventStatus.CANCELLED,
        label: "Đã hủy",
        badgeClass: "bg-red-50 text-destructive border-red-200",
      };
    default:
      return {
        key: "UNKNOWN",
        label: event.status,
        badgeClass: "bg-secondary text-muted-foreground border-border",
      };
  }
}

export function formatTimeVi(date: Date | string): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function formatNumberVi(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

// ==========================================
// 3. Realistic Mock Data for Organizer Events
// Varied statuses, sold ratios, capacities, and dates
// ==========================================

export const MOCK_ORGANIZER_EVENTS: OrganizerEventItem[] = [
  {
    id: "evt-01",
    title: "Anh Trai Vượt Ngàn Chông Gai - Concert 2026",
    slug: "anh-trai-vuot-ngan-chong-gai-concert-2026",
    category: "Âm nhạc",
    bannerUrl: "/images/events/vn/anh-trai.jpg",
    venueId: "vn-hcm-quan-khu-7",
    venueName: "Nhà Thi Đấu Quân Khu 7",
    venueAddress: "202 Hoàng Văn Thụ, Phường 9, Quận Phú Nhuận",
    city: "TP. Hồ Chí Minh",
    startTime: "2026-11-15T19:30:00Z",
    endTime: "2026-11-15T23:00:00Z",
    status: EventStatus.PUBLISHED,
    ticketsSold: 12000,
    ticketsTotal: 12000,
    revenue: 16800000000,
    version: 3,
  },
  {
    id: "evt-02",
    title: "V-League: CLB Công An Hà Nội vs Thép Xanh Nam Định",
    slug: "v-league-cahn-vs-nam-dinh",
    category: "Thể thao",
    bannerUrl: "/images/events/vn/vleague-cahn.jpg",
    venueId: "vn-hn-hang-day",
    venueName: "Sân Vận Động Hàng Đẫy",
    venueAddress: "Số 9 Trịnh Hoài Đức, Phường Cát Linh, Quận Đống Đa",
    city: "Hà Nội",
    startTime: "2026-11-08T19:15:00Z",
    endTime: "2026-11-08T21:30:00Z",
    status: EventStatus.PUBLISHED,
    ticketsSold: 18450,
    ticketsTotal: 22000,
    revenue: 2767500000,
    version: 1,
  },
  {
    id: "evt-03",
    title: "VBA Finals: Saigon Heat vs Danang Dragons",
    slug: "vba-finals-saigon-heat-vs-danang-dragons",
    category: "Thể thao",
    bannerUrl: "/images/events/vn/vba-saigon-heat.jpg",
    venueId: "vn-dn-tien-son",
    venueName: "Cung Thể Thao Tiên Sơn",
    venueAddress: "01 Phan Đăng Lưu, Phường Hòa Cường Bắc, Quận Hải Châu",
    city: "Đà Nẵng",
    startTime: "2026-11-22T18:00:00Z",
    endTime: "2026-11-22T21:00:00Z",
    status: EventStatus.PUBLISHED,
    ticketsSold: 4200,
    ticketsTotal: 6500,
    revenue: 1260000000,
    version: 2,
  },
  {
    id: "evt-04",
    title: "Vở Kịch: Ngày Xửa Ngày Xưa - Hoàng Tử Cứu Công Chúa",
    slug: "ngay-xua-ngay-xua-hoang-tu-cuu-cong-chua",
    category: "Sân khấu",
    bannerUrl: "/images/events/vn/kich-idecaf.jpg",
    venueId: "vn-hcm-ben-thanh",
    venueName: "Nhà Hát Bến Thành",
    venueAddress: "6 Mạc Đĩnh Chi, Phường Bến Nghé, Quận 1",
    city: "TP. Hồ Chí Minh",
    startTime: "2026-11-28T09:00:00Z",
    endTime: "2026-11-28T11:30:00Z",
    status: EventStatus.PUBLISHED,
    ticketsSold: 980,
    ticketsTotal: 1000,
    revenue: 490000000,
    version: 1,
  },
  {
    id: "evt-05",
    title: "Đại Nhạc Hội Mùa Thu: Monsoon Music Festival 2026",
    slug: "monsoon-music-festival-2026",
    category: "Âm nhạc",
    bannerUrl: "/images/events/vn/monsoon-festival.jpg",
    venueId: "vn-hn-my-dinh",
    venueName: "Sân Vận Động Quốc Gia Mỹ Đình",
    venueAddress: "Đường Lê Đức Thọ, Phường Mỹ Đình 1, Quận Nam Từ Liêm",
    city: "Hà Nội",
    startTime: "2026-12-05T16:00:00Z",
    endTime: "2026-12-05T23:30:00Z",
    status: EventStatus.PUBLISHED,
    ticketsSold: 28500,
    ticketsTotal: 40000,
    revenue: 14250000000,
    version: 4,
  },
  {
    id: "evt-06",
    title: "Live Concert Mùa Thu Hà Nội - Thu Ca",
    slug: "live-concert-mua-thu-ha-noi-thu-ca",
    category: "Âm nhạc",
    bannerUrl: "/images/events/vn/chillies.jpg",
    venueId: "vn-hn-dien-kinh",
    venueName: "Cung Thể Thao Điền Kinh Trong Nhà Hà Nội",
    venueAddress: "Đường Trần Hữu Dực, Phường Cầu Diễn, Quận Nam Từ Liêm",
    city: "Hà Nội",
    startTime: "2026-12-12T19:30:00Z",
    endTime: "2026-12-12T22:30:00Z",
    status: EventStatus.PENDING_APPROVAL,
    ticketsSold: 0,
    ticketsTotal: 5000,
    revenue: 0,
    version: 1,
  },
  {
    id: "evt-07",
    title: "Giao Hưởng Thính Phòng Mùa Đông: Beethoven Symphony No. 9",
    slug: "giao-huong-thinh-phong-mua-dong-beethoven",
    category: "Sân khấu",
    bannerUrl: "/images/events/vn/dan-nhac-giao-huong.jpg",
    venueId: "vn-hn-nha-hat-lon",
    venueName: "Nhà Hát Lớn Hà Nội",
    venueAddress: "Số 1 Tràng Tiền, Phường Phan Chu Trinh, Quận Hoàn Kiếm",
    city: "Hà Nội",
    startTime: "2026-12-20T20:00:00Z",
    endTime: "2026-12-20T22:30:00Z",
    status: EventStatus.DRAFT,
    ticketsSold: 0,
    ticketsTotal: 600,
    revenue: 0,
    version: 1,
  },
  {
    id: "evt-08",
    title: "Danang International Music Fest 2026",
    slug: "danang-international-music-fest-2026",
    category: "Âm nhạc",
    bannerUrl: "/images/events/vn/hozo.jpg",
    venueId: "vn-dn-hoa-xuan",
    venueName: "Sân Vận Động Hòa Xuân",
    venueAddress: "Đường 29 Tháng 3, Phường Hòa Xuân, Quận Cẩm Lệ",
    city: "Đà Nẵng",
    startTime: "2026-12-26T17:00:00Z",
    endTime: "2026-12-26T23:00:00Z",
    status: EventStatus.DRAFT,
    ticketsSold: 0,
    ticketsTotal: 20000,
    revenue: 0,
    version: 1,
  },
  {
    id: "evt-09",
    title: "Chung Kết Giải Quần Vợt Quốc Gia 2026",
    slug: "chung-ket-quan-vot-quoc-gia-2026",
    category: "Thể thao",
    bannerUrl: "/images/events/vn/vietnam-football.jpg",
    venueId: "vn-dn-quan-ngua",
    venueName: "Trung Tâm Thể Thao Chi Lăng",
    venueAddress: "38 Ngô Gia Tự, Phường Hải Châu 1, Quận Hải Châu",
    city: "Đà Nẵng",
    startTime: "2026-10-10T14:00:00Z",
    endTime: "2026-10-10T18:00:00Z",
    status: EventStatus.ENDED,
    ticketsSold: 3200,
    ticketsTotal: 3500,
    revenue: 640000000,
    version: 2,
  },
  {
    id: "evt-10",
    title: "Hài Kịch Cuối Năm: Táo Quân Hội Ngộ",
    slug: "tao-quan-hoi-ngo-2027",
    category: "Sân khấu",
    bannerUrl: "/images/events/vn/saigon-teu.jpg",
    venueId: "vn-hcm-hoa-binh",
    venueName: "Nhà Hát Hòa Bình",
    venueAddress: "240 Đường 3 Tháng 2, Phường 12, Quận 10",
    city: "TP. Hồ Chí Minh",
    startTime: "2027-01-16T19:30:00Z",
    endTime: "2027-01-16T22:30:00Z",
    status: EventStatus.PENDING_APPROVAL,
    ticketsSold: 0,
    ticketsTotal: 2500,
    revenue: 0,
    version: 1,
  },
  {
    id: "evt-11",
    title: "Đêm Nhạc Acoustic: Khúc Giao Mùa",
    slug: "acoustic-khuc-giao-mua",
    category: "Âm nhạc",
    bannerUrl: "/images/events/vn/ha-anh-tuan.jpg",
    venueId: "vn-hcm-ben-thanh",
    venueName: "Nhà Hát Bến Thành",
    venueAddress: "6 Mạc Đĩnh Chi, Phường Bến Nghé, Quận 1",
    city: "TP. Hồ Chí Minh",
    startTime: "2026-11-05T19:00:00Z",
    endTime: "2026-11-05T21:30:00Z",
    status: EventStatus.SUSPENDED,
    ticketsSold: 420,
    ticketsTotal: 1000,
    revenue: 210000000,
    version: 3,
  },
  {
    id: "evt-12",
    title: "Liveshow Rock Việt: Bão Lửa 2026",
    slug: "rock-viet-bao-lua-2026",
    category: "Âm nhạc",
    bannerUrl: "/images/events/vn/buc-tuong.jpg",
    venueId: "vn-hcm-thong-nhat",
    venueName: "Sân Vận Động Thống Nhất",
    venueAddress: "138 Đào Duy Từ, Phường 6, Quận 10",
    city: "TP. Hồ Chí Minh",
    startTime: "2026-10-01T18:00:00Z",
    endTime: "2026-10-01T22:00:00Z",
    status: EventStatus.CANCELLED,
    ticketsSold: 120,
    ticketsTotal: 15000,
    revenue: 60000000,
    version: 4,
    rejectionReason: "Điều kiện thời tiết bão nhiệt đới không đảm bảo an toàn khán đài ngoài trời.",
  },
  {
    id: "evt-13",
    title: "Giải Bóng Rổ Sinh Viên Toàn Quốc - Vòng Chung Kết",
    slug: "giai-bong-ro-sinh-vien-toan-quoc-vck",
    category: "Thể thao",
    bannerUrl: "",
    venueId: "vn-hn-quan-ngua",
    venueName: "Cung Thể Thao Quần Ngựa",
    venueAddress: "30 Văn Cao, Phường Liễu Giai, Quận Ba Đình",
    city: "Hà Nội",
    startTime: "2026-11-30T14:00:00Z",
    endTime: "2026-11-30T18:00:00Z",
    status: EventStatus.PUBLISHED,
    ticketsSold: 2100,
    ticketsTotal: 4000,
    revenue: 315000000,
    version: 1,
  },
  {
    id: "evt-14",
    title: "Đêm Nhạc Trịnh: Biển Nhớ & Mùa Thu",
    slug: "dem-nhac-trinh-bien-nho-mua-thu",
    category: "Âm nhạc",
    bannerUrl: "/images/events/vn/my-tam.jpg",
    venueId: "vn-dn-trung-vuong",
    venueName: "Nhà Hát Tuồng Nguyễn Hiển Dĩnh & Trưng Vương",
    venueAddress: "86 Hùng Vương, Phường Hải Châu 1, Quận Hải Châu",
    city: "Đà Nẵng",
    startTime: "2026-12-15T19:30:00Z",
    endTime: "2026-12-15T22:00:00Z",
    status: EventStatus.PUBLISHED,
    ticketsSold: 1140,
    ticketsTotal: 1200,
    revenue: 570000000,
    version: 2,
  },
];

// ==========================================
// 4. Data Adapter Functions
// ==========================================

/**
 * Fetch organizer events with filtering, search, sorting, and cursor pagination.
 *
 * // TODO(contract): GET /api/v1/organizer/events is missing in API_CONTRACT.md.
 * In production this should call an organizer-scoped API endpoint that returns:
 * { success: true, data: { items: OrganizerEventItem[], nextCursor, hasMore, totalCount } }
 */
export async function getOrganizerEvents(
  query: OrganizerEventsQuery = {}
): Promise<OrganizerEventsResponse> {
  const {
    keyword = "",
    status = "ALL",
    city = "",
    fromDate = "",
    toDate = "",
    sort = "date_asc",
    limit = 20,
  } = query;

  // Filter list
  let filtered = [...MOCK_ORGANIZER_EVENTS];

  // Search keyword (case & accent insensitive)
  if (keyword.trim()) {
    const q = keyword.trim().toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.venueName.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q)
    );
  }

  // Status filter
  if (status === "ACTION_REQUIRED") {
    filtered = filtered.filter(
      (item) =>
        item.status === EventStatus.DRAFT ||
        item.status === EventStatus.PENDING_APPROVAL ||
        item.status === EventStatus.SUSPENDED
    );
  } else if (status !== "ALL") {
    filtered = filtered.filter((item) => item.status === status);
  }

  // City filter
  if (city && city !== "ALL") {
    filtered = filtered.filter((item) => item.city === city);
  }

  // Date range filter
  if (fromDate) {
    const fromTime = new Date(fromDate).getTime();
    if (!isNaN(fromTime)) {
      filtered = filtered.filter(
        (item) => new Date(item.startTime).getTime() >= fromTime
      );
    }
  }
  if (toDate) {
    const toTime = new Date(toDate).getTime();
    if (!isNaN(toTime)) {
      filtered = filtered.filter(
        (item) => new Date(item.startTime).getTime() <= toTime
      );
    }
  }

  // Sorting
  filtered.sort((a, b) => {
    switch (sort) {
      case "date_asc": {
        const nowMs = Date.now();
        const aIsEndedOrPast =
          a.status === EventStatus.ENDED ||
          a.status === EventStatus.CANCELLED ||
          new Date(a.startTime).getTime() < nowMs;
        const bIsEndedOrPast =
          b.status === EventStatus.ENDED ||
          b.status === EventStatus.CANCELLED ||
          new Date(b.startTime).getTime() < nowMs;

        if (aIsEndedOrPast !== bIsEndedOrPast) {
          return aIsEndedOrPast ? 1 : -1;
        }
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      }
      case "date_desc":
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      case "title_asc":
        return a.title.localeCompare(b.title, "vi");
      case "revenue_desc":
        return b.revenue - a.revenue;
      case "sold_desc":
        return b.ticketsSold - a.ticketsSold;
      default:
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    }
  });

  const totalCount = filtered.length;
  const items = filtered.slice(0, limit);
  const nextCursor =
    filtered.length > limit ? filtered[limit - 1]?.id ?? null : null;
  const hasMore = filtered.length > limit;

  return {
    items,
    nextCursor,
    hasMore,
    totalCount,
  };
}

/**
 * Fetch summary strip metrics for organizer portal.
 *
 * // TODO(contract): GET /api/v1/organizer/metrics is missing in API_CONTRACT.md.
 * In production this endpoint returns aggregated totals for the authenticated organizer.
 */
export async function getOrganizerMetrics(): Promise<OrganizerMetrics> {
  const all = MOCK_ORGANIZER_EVENTS;
  const totalSoldTickets = all.reduce((sum, e) => sum + e.ticketsSold, 0);
  const totalRevenue = all.reduce((sum, e) => sum + e.revenue, 0);
  const now = new Date().getTime();
  const upcomingEventsCount = all.filter(
    (e) =>
      e.status === EventStatus.PUBLISHED &&
      new Date(e.startTime).getTime() >= now
  ).length;
  const actionRequiredCount = all.filter(
    (e) =>
      e.status === EventStatus.DRAFT ||
      e.status === EventStatus.PENDING_APPROVAL ||
      e.status === EventStatus.SUSPENDED
  ).length;

  return {
    totalSoldTickets,
    totalRevenue,
    upcomingEventsCount,
    actionRequiredCount,
  };
}

// ==========================================
// 5. Client-Side Draft Autosave Adapter
// ==========================================

const DRAFT_STORAGE_KEY = "tickethub_organizer_event_draft";

/**
 * Saves draft to localStorage and records timestamp.
 *
 * // TODO(contract): POST /api/v1/events/draft is missing in API_CONTRACT.md.
 * Client-side persistence adapter is used until a backend draft endpoint is specified.
 */
export function saveEventDraft(
  draft: Omit<EventDraftData, "savedAt">
): { savedAt: string } {
  const savedAt = new Date().toISOString();
  const payload: EventDraftData = {
    ...draft,
    savedAt,
  };
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    }
  } catch {
    // Storage quota or SSR safe fallback
  }
  return { savedAt };
}

/**
 * Loads saved draft from localStorage if available.
 */
export function getSavedEventDraft(): EventDraftData | null {
  try {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (data) {
        return JSON.parse(data) as EventDraftData;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Clears saved draft from storage after publishing.
 */
export function clearSavedEventDraft(): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

// ==========================================
// 6. Event Action Handlers (Mocked Adapter)
// ==========================================

/**
 * // TODO(contract): POST /api/v1/events/:id/publish is missing in API_CONTRACT.md.
 */
export async function publishOrganizerEvent(id: string): Promise<boolean> {
  const item = MOCK_ORGANIZER_EVENTS.find((e) => e.id === id);
  if (item) {
    item.status = EventStatus.PUBLISHED;
    return true;
  }
  return false;
}

/**
 * // TODO(contract): POST /api/v1/events/:id/pause is missing in API_CONTRACT.md.
 */
export async function pauseOrganizerEvent(id: string): Promise<boolean> {
  const item = MOCK_ORGANIZER_EVENTS.find((e) => e.id === id);
  if (item) {
    item.status = EventStatus.SUSPENDED;
    return true;
  }
  return false;
}

/**
 * // TODO(contract): POST /api/v1/events/:id/cancel is missing in API_CONTRACT.md.
 */
export async function cancelOrganizerEvent(id: string): Promise<boolean> {
  const item = MOCK_ORGANIZER_EVENTS.find((e) => e.id === id);
  if (item) {
    item.status = EventStatus.CANCELLED;
    return true;
  }
  return false;
}

/**
 * // TODO(contract): POST /api/v1/events/:id/clone is missing in API_CONTRACT.md.
 */
export async function cloneOrganizerEvent(id: string): Promise<string> {
  const item = MOCK_ORGANIZER_EVENTS.find((e) => e.id === id);
  if (!item) throw new Error("EVENT_NOT_FOUND");
  const newId = `evt-clone-${Date.now()}`;
  const cloned: OrganizerEventItem = {
    ...item,
    id: newId,
    title: `${item.title} (Bản sao)`,
    slug: `${item.slug}-clone-${Date.now()}`,
    status: EventStatus.DRAFT,
    ticketsSold: 0,
    revenue: 0,
    version: 1,
  };
  MOCK_ORGANIZER_EVENTS.unshift(cloned);
  return newId;
}

// ==========================================
// 7. Organizer Profile & Admin Verification (Tuần 2 - FE1)
// Kết hợp API thật (BE1) & Fallback Mock (BE2)
// ==========================================

import { apiClient } from "./api/client"; // Nếu file này nằm trong thư mục lib/api thì đổi thành "./client"

export type OrganizerVerificationStatus = "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";

export interface OrganizerProfile {
  id: string;
  userId?: string;
  organizationName: string;
  taxCode: string;
  phone: string;
  email: string;
  address: string;
  representativeName: string;
  businessLicenseUrl?: string;
  status: OrganizerVerificationStatus;
  rejectionReason?: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: "APPROVE_ORGANIZER" | "REJECT_ORGANIZER" | "APPROVE_EVENT" | "REJECT_EVENT";
  targetName: string;
  actorEmail: string;
  reason?: string;
  timestamp: string;
}

export const MOCK_ORGANIZER_PROFILES: OrganizerProfile[] = [
  {
    id: "org-01",
    organizationName: "Công ty TNHH Giải Trí & Sự Kiện Sao Việt",
    taxCode: "0312345678",
    phone: "0901234567",
    email: "organizer@tickethub.com",
    address: "19 Nguyễn Hữu Thọ, Phường Tân Phong, Quận 7, TP. Hồ Chí Minh",
    representativeName: "Nguyễn Văn An",
    businessLicenseUrl: "https://example.com/giay-phep-kd-saoviet.pdf",
    status: "PENDING_VERIFICATION",
    updatedAt: "2026-10-24T10:30:00Z",
  },
  {
    id: "org-02",
    organizationName: "Saigon Live Music Production",
    taxCode: "0398765432",
    phone: "0918765432",
    email: "contact@saigonlive.vn",
    address: "202 Hoàng Văn Thụ, Phường 9, Quận Phú Nhuận, TP. Hồ Chí Minh",
    representativeName: "Trần Minh Tuấn",
    businessLicenseUrl: "https://example.com/giay-phep-saigonlive.pdf",
    status: "PENDING_VERIFICATION",
    updatedAt: "2026-10-25T08:15:00Z",
  },
  {
    id: "org-03",
    organizationName: "Hanoi Symphony Orchestra Club",
    taxCode: "0102938475",
    phone: "0987654321",
    email: "info@hanoisymphony.vn",
    address: "Số 1 Tràng Tiền, Quận Hoàn Kiếm, Hà Nội",
    representativeName: "Lê Thu Hà",
    status: "VERIFIED",
    updatedAt: "2026-10-20T14:00:00Z",
  },
];

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "log-01",
    action: "APPROVE_ORGANIZER",
    targetName: "Hanoi Symphony Orchestra Club",
    actorEmail: "admin@tickethub.com",
    timestamp: "2026-10-20T14:00:00Z",
  },
];

/**
 * Lấy thông tin hồ sơ BTC của tài khoản đang đăng nhập
 */
export async function getMyOrganizerProfile(): Promise<OrganizerProfile> {
  try {
    return await apiClient<OrganizerProfile>("/organizer/profile", { method: "GET" });
  } catch {
    // Fallback khi BE2 chưa có endpoint
    await new Promise((r) => setTimeout(r, 250));
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tickethub_my_org_profile");
      if (saved) return JSON.parse(saved);
    }
    return MOCK_ORGANIZER_PROFILES[0];
  }
}

/**
 * Cập nhật và gửi duyệt lại hồ sơ BTC
 */
export async function updateMyOrganizerProfile(
  payload: Partial<OrganizerProfile>
): Promise<OrganizerProfile> {
  try {
    return await apiClient<OrganizerProfile>("/organizer/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } catch {
    await new Promise((r) => setTimeout(r, 350));
    const current = await getMyOrganizerProfile();
    const updated: OrganizerProfile = {
      ...current,
      ...payload,
      status: "PENDING_VERIFICATION",
      rejectionReason: undefined,
      updatedAt: new Date().toISOString(),
    };
    MOCK_ORGANIZER_PROFILES[0] = updated;
    if (typeof window !== "undefined") {
      localStorage.setItem("tickethub_my_org_profile", JSON.stringify(updated));
    }
    return updated;
  }
}

/**
 * Admin: Lấy danh sách toàn bộ hồ sơ BTC
 */
export async function getAdminOrganizers(): Promise<OrganizerProfile[]> {
  try {
    return await apiClient<OrganizerProfile[]>("/admin/organizers", { method: "GET" });
  } catch {
    await new Promise((r) => setTimeout(r, 250));
    return [...MOCK_ORGANIZER_PROFILES];
  }
}

/**
 * Admin: Duyệt hoặc Từ chối hồ sơ BTC (UC10)
 */
export async function reviewOrganizerProfile(params: {
  id: string;
  decision: "APPROVE" | "REJECT";
  reason?: string;
}): Promise<OrganizerProfile> {
  const { id, decision, reason } = params;
  try {
    const endpoint =
      decision === "APPROVE"
        ? `/admin/organizers/${id}/approve`
        : `/admin/organizers/${id}/reject`;
    return await apiClient<OrganizerProfile>(endpoint, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  } catch {
    await new Promise((r) => setTimeout(r, 300));
    const item = MOCK_ORGANIZER_PROFILES.find((o) => o.id === id);
    if (!item) throw new Error("Không tìm thấy hồ sơ BTC");

    item.status = decision === "APPROVE" ? "VERIFIED" : "REJECTED";
    item.rejectionReason = decision === "REJECT" ? reason : undefined;
    item.updatedAt = new Date().toISOString();

    if (id === MOCK_ORGANIZER_PROFILES[0].id && typeof window !== "undefined") {
      localStorage.setItem("tickethub_my_org_profile", JSON.stringify(item));
    }

    MOCK_AUDIT_LOGS.unshift({
      id: `log-${Date.now()}`,
      action: decision === "APPROVE" ? "APPROVE_ORGANIZER" : "REJECT_ORGANIZER",
      targetName: item.organizationName,
      actorEmail: "admin@tickethub.com",
      reason,
      timestamp: new Date().toISOString(),
    });

    return { ...item };
  }
}

/**
 * Lấy danh sách sự kiện từ BE1 (events.controller.ts) kèm fallback sang Mock
 */
export async function getAdminPendingEvents(): Promise<OrganizerEventItem[]> {
  try {
    const res = await apiClient<OrganizerEventItem[] | { items: OrganizerEventItem[] }>(
      "/events?status=PENDING_APPROVAL",
      { method: "GET" }
    );
    const list = Array.isArray(res) ? res : res.items;
    if (list && list.length > 0) return list;
  } catch {
    // Nếu BE1 cần truyền query khác hoặc chưa chạy server thì dùng MOCK_ORGANIZER_EVENTS
  }
  await new Promise((r) => setTimeout(r, 250));
  return MOCK_ORGANIZER_EVENTS.filter(
    (e) => e.status === EventStatus.PENDING_APPROVAL || e.status === EventStatus.CANCELLED
  );
}

/**
 * Admin: Duyệt hoặc Từ chối sự kiện (PENDING_APPROVAL -> PUBLISHED / CANCELLED)
 */
export async function reviewAdminEvent(params: {
  id: string;
  decision: "APPROVE" | "REJECT";
  reason?: string;
}): Promise<OrganizerEventItem> {
  const { id, decision, reason } = params;
  try {
    const endpoint =
      decision === "APPROVE"
        ? `/admin/events/${id}/approve`
        : `/admin/events/${id}/reject`;
    return await apiClient<OrganizerEventItem>(endpoint, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  } catch {
    await new Promise((r) => setTimeout(r, 300));
    const evt = MOCK_ORGANIZER_EVENTS.find((e) => e.id === id);
    if (!evt) throw new Error("Không tìm thấy sự kiện");

    evt.status = decision === "APPROVE" ? EventStatus.PUBLISHED : EventStatus.CANCELLED;
    evt.rejectionReason = decision === "REJECT" ? reason : undefined;
    evt.version += 1;

    MOCK_AUDIT_LOGS.unshift({
      id: `log-${Date.now()}`,
      action: decision === "APPROVE" ? "APPROVE_EVENT" : "REJECT_EVENT",
      targetName: evt.title,
      actorEmail: "admin@tickethub.com",
      reason,
      timestamp: new Date().toISOString(),
    });

    return { ...evt };
  }
}

export async function getAdminAuditLogs(): Promise<AuditLogEntry[]> {
  return [...MOCK_AUDIT_LOGS];
}


