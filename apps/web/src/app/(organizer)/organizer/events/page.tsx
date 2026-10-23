import Link from "next/link";
import {
  CalendarPlus,
  MapPin,
  Calendar,
  ExternalLink,
  Ticket,
  TrendingUp,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { EVENTS, getEventVenueMapKey } from "@/lib/events-catalog";

const VENUE_TEMPLATE_LABELS: Record<string, string> = {
  "arena-t-stage": "Sân khấu chữ T (Nhà thi đấu)",
  "stadium-concert": "SVĐ Mega Concert (Sân khấu ngoài trời)",
  "stadium-football": "Sân Vận Động (Sân bóng đá)",
  "arena-basketball": "Sàn thi đấu thể thao (Bóng rổ/Võ thuật)",
  theater: "Nhà Hát & Thính Phòng",
};

export default function OrganizerEventsPage() {
  const totalEvents = EVENTS.length;
  const activeEvents = EVENTS.length;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-slate-900">
            Quản lý sự kiện &amp; Sơ đồ ghế
          </h1>
          <p className="text-[14px] text-slate-500">
            Cổng quản trị dành cho Ban Tổ Chức (BTC): Quản lý mẫu sơ đồ vị trí, giá vé từng khu vực và phát hành vé điện tử.
          </p>
        </div>
        <Link
          href="/organizer/events/new"
          className="inline-flex items-center gap-2 px-5 h-11 rounded-[10px] bg-primary hover:bg-emerald-700 text-white text-[13px] font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <CalendarPlus className="size-4.5" />
          Tạo sự kiện &amp; Chọn sơ đồ mới
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[14px] border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-[13px]">
            <span>Tổng sự kiện đã tạo</span>
            <Ticket className="size-4 text-primary" />
          </div>
          <div className="text-[28px] font-extrabold text-slate-900">{totalEvents}</div>
          <p className="text-[12px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="size-3.5" /> 100% kết nối sơ đồ kiến trúc SVG
          </p>
        </div>

        <div className="bg-white p-5 rounded-[14px] border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-[13px]">
            <span>Đang mở bán vé</span>
            <Clock className="size-4 text-emerald-600" />
          </div>
          <div className="text-[28px] font-extrabold text-slate-900">{activeEvents}</div>
          <p className="text-[12px] text-slate-500">Hỗ trợ giữ chỗ nguyên tử 5 phút</p>
        </div>

        <div className="bg-white p-5 rounded-[14px] border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-[13px]">
            <span>Mẫu địa điểm hỗ trợ</span>
            <ShieldCheck className="size-4 text-blue-600" />
          </div>
          <div className="text-[28px] font-extrabold text-slate-900">5</div>
          <p className="text-[12px] text-slate-500">Sân vận động, Nhà thi đấu chữ T, Khán phòng</p>
        </div>

        <div className="bg-white p-5 rounded-[14px] border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-[13px]">
            <span>Bảo mật chống vé giả</span>
            <ShieldCheck className="size-4 text-primary" />
          </div>
          <div className="text-[28px] font-extrabold text-slate-900">100%</div>
          <p className="text-[12px] text-emerald-600 font-semibold">Chống làm giả &amp; đầu cơ</p>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-[16px] border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">
              Danh sách sự kiện đang quản lý
            </h2>
            <p className="text-[12px] text-slate-500">
              Mỗi sự kiện được liên kết với một mô hình vector sơ đồ khán đài thực tế.
            </p>
          </div>
          <span className="text-[12px] text-slate-500 font-medium">
            Hiển thị {EVENTS.length} sự kiện
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[12px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                <th className="py-3.5 px-6">Sự kiện &amp; Thời gian</th>
                <th className="py-3.5 px-6">Địa điểm &amp; Thành phố</th>
                <th className="py-3.5 px-6">Mẫu sơ đồ vị trí</th>
                <th className="py-3.5 px-6">Giá vé từ</th>
                <th className="py-3.5 px-6">Trạng thái</th>
                <th className="py-3.5 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {EVENTS.map((event) => {
                const mapKey = getEventVenueMapKey(event);
                const templateLabel = VENUE_TEMPLATE_LABELS[mapKey] || "Sơ đồ kiến trúc";

                return (
                  <tr key={event.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Event Title & Image */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-16 h-10 object-cover rounded-[8px] bg-slate-100 shrink-0 border border-slate-200"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/events/${event.id}`}
                            className="font-bold text-slate-900 hover:text-primary transition-colors line-clamp-1"
                          >
                            {event.title}
                          </Link>
                          <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                            <Calendar className="size-3.5 text-primary shrink-0" />
                            <span>{event.fullDateTime}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Venue & City */}
                    <td className="py-4 px-6 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium">{event.venue}</span>
                      </div>
                      <span className="text-[12px] text-slate-500 pl-5">{event.city}</span>
                    </td>

                    {/* Venue Template */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-slate-100 text-slate-800 text-[12px] font-semibold border border-slate-200">
                        {templateLabel}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {event.fromPrice}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ● Đang mở bán
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/events/${event.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-slate-200 hover:border-primary hover:text-primary text-[12px] font-bold text-slate-700 transition-colors shadow-2xs"
                      >
                        <ExternalLink className="size-3.5" />
                        Xem sơ đồ ghế
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
