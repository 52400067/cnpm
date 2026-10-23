export type CategoryCode = "ALL" | "CONCERT" | "SPORT" | "THEATER" | "FESTIVAL";

export type SeatStatus = "AVAILABLE" | "HELD" | "SOLD";

export interface SeatItem {
  id: string;
  seatNumber: string;
  rowLabel: string;
  zoneId: string;
  zoneName: string;
  status: SeatStatus;
  price: number;
}

export interface SeatRow {
  rowLabel: string;
  seats: SeatItem[];
}

export interface EventZone {
  zoneId: string;
  zoneName: string;
  description: string;
  isSeated: boolean;
  ticketTypeId: string;
  price: number;
  maxPerOrder: number;
  availableCount: number;
  rows: SeatRow[];
  layoutPosition:
    | "FRONT_LEFT"
    | "FRONT_RIGHT"
    | "CENTER_STANDING"
    | "LOWER_TIER"
    | "UPPER_TIER";
}

export interface EventItem {
  id: string;
  title: string;
  category: Exclude<CategoryCode, "ALL">;
  dateRange: string;
  fullDateTime: string;
  doorsOpenTime: string;
  dateWindow: "WEEKEND" | "NOV" | "DEC";
  venue: string;
  venueAddress: string;
  city: string;
  cityCode: "HCM" | "HN" | "DN";
  fromPrice: string;
  minPriceNumber: number;
  organizerName: string;
  description: string;
  image: string;
  portraitImage?: string;
  featuredOrder?: number;
  trendingOrder?: number;
}

export const EVENTS: EventItem[] = [
  // 4 Popular Portrait Marquee Events (286x352 aspect ratio)
  {
    id: "evt-anh-trai-vuot-ngan-chong-gai",
    title: "Anh Trai Vượt Ngàn Chông Gai",
    category: "CONCERT",
    dateRange: "15 Th11 - 16 Th11",
    fullDateTime: "T7, 15 Th11, 2026 • 19:30",
    doorsOpenTime: "17:00",
    dateWindow: "WEEKEND",
    venue: "Vạn Phúc City",
    venueAddress: "Khu đô thị Vạn Phúc, Quốc lộ 13, TP. Thủ Đức, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    cityCode: "HCM",
    fromPrice: "800.000 ₫+",
    minPriceNumber: 800000,
    organizerName: "YeaH1 Tập Đoàn Truyền Thông",
    description:
      "Đêm nhạc quy tụ 33 Anh Tài cùng hệ thống sân khấu ngoài trời hoành tráng, âm thanh L-Acoustics tiêu chuẩn quốc tế và hơn 35 bản mashup độc quyền.",
    image: "/images/events/vn/anh-trai.jpg",
    portraitImage: "/images/events/vn/anh-trai.jpg",
    featuredOrder: 1,
  },
  {
    id: "evt-ha-anh-tuan-sketch-a-rose",
    title: "Hà Anh Tuấn: Sketch A Rose",
    category: "CONCERT",
    dateRange: "16 Th11 - 23 Th11",
    fullDateTime: "CN, 16 Th11, 2026 • 20:00",
    doorsOpenTime: "18:30",
    dateWindow: "WEEKEND",
    venue: "Nhà hát Hòa Bình",
    venueAddress: "240 Đường 3 Tháng 2, Phường 12, Quận 10, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    cityCode: "HCM",
    fromPrice: "1.200.000 ₫+",
    minPriceNumber: 1200000,
    organizerName: "Viet Vision Entertainment",
    description:
      "Live concert cá nhân của Hà Anh Tuấn kết hợp cùng dàn nhạc giao hưởng và ban nhạc acoustic trong không gian thính phòng sang trọng tại Nhà hát Hòa Bình.",
    image: "/images/events/vn/ha-anh-tuan.jpg",
    portraitImage: "/images/events/vn/ha-anh-tuan.jpg",
    featuredOrder: 2,
  },
  {
    id: "evt-nhung-thanh-pho-mo-mang",
    title: "Những Thành Phố Mơ Màng",
    category: "FESTIVAL",
    dateRange: "22 Th11 - 06 Th12",
    fullDateTime: "T7, 22 Th11, 2026 • 16:00",
    doorsOpenTime: "14:30",
    dateWindow: "NOV",
    venue: "Công viên Yên Sở",
    venueAddress: "Nút giao Pháp Vân, Quận Hoàng Mai, Hà Nội",
    city: "Hà Nội",
    cityCode: "HN",
    fromPrice: "650.000 ₫+",
    minPriceNumber: 650000,
    organizerName: "NTPMM Collective",
    description:
      "Lễ hội âm nhạc Indie & Alternative lớn nhất miền Bắc với 8 tiếng trình diễn liên tục từ hoàng hôn đến đêm muộn giữa không gian xanh Công viên Yên Sở.",
    image: "/images/events/vn/ntpmm.jpg",
    portraitImage: "/images/events/vn/ntpmm.jpg",
    featuredOrder: 3,
  },
  {
    id: "evt-rock-viet-buc-tuong",
    title: "Rock Việt: Bức Tường Live",
    category: "CONCERT",
    dateRange: "29 Th11 - 13 Th12",
    fullDateTime: "T7, 29 Th11, 2026 • 19:30",
    doorsOpenTime: "17:30",
    dateWindow: "NOV",
    venue: "SVĐ Quân Khu 7",
    venueAddress: "202 Hoàng Văn Thụ, Phường 9, Quận Phú Nhuận, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    cityCode: "HCM",
    fromPrice: "500.000 ₫+",
    minPriceNumber: 500000,
    organizerName: "Bức Tường Band & RockViet",
    description:
      "Đêm nhạc kỷ niệm hành trình 30 năm của ban nhạc Bức Tường cùng các nghệ sĩ khách mời hàng đầu dòng nhạc Rock Việt Nam tại SVĐ Quân Khu 7.",
    image: "/images/events/vn/buc-tuong.jpg",
    portraitImage: "/images/events/vn/buc-tuong.jpg",
    featuredOrder: 4,
  },

  // Trending Events Near You
  {
    id: "evt-den-vau-show-cua-den",
    title: "Đen Vâu: Show Của Đen",
    category: "CONCERT",
    dateRange: "T7, 29 Th11 • 19:30",
    fullDateTime: "T7, 29 Th11, 2026 • 19:30",
    doorsOpenTime: "17:30",
    dateWindow: "NOV",
    venue: "Cung Điền kinh Mỹ Đình",
    venueAddress: "Đường Trần Hữu Dực, Quận Nam Từ Liêm, Hà Nội",
    city: "Hà Nội",
    cityCode: "HN",
    fromPrice: "700.000 ₫+",
    minPriceNumber: 700000,
    organizerName: "Đen Vâu & Đồng Âm Production",
    description:
      "Show Của Đen trở lại thủ đô Hà Nội với sự góp mặt của dàn hợp xướng, dàn nhạc giao hưởng và những bản rap gắn liền với thanh xuân của hàng vạn Đồng Âm.",
    image: "/images/events/vn/den-vau.jpg",
    trendingOrder: 1,
  },
  {
    id: "evt-soobin-live-showcase",
    title: "SOOBIN Live Showcase",
    category: "CONCERT",
    dateRange: "T6, 21 Th11 • 20:00",
    fullDateTime: "T6, 21 Th11, 2026 • 20:00",
    doorsOpenTime: "18:30",
    dateWindow: "NOV",
    venue: "Nhà thi đấu Nguyễn Du",
    venueAddress: "116 Nguyễn Du, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    cityCode: "HCM",
    fromPrice: "750.000 ₫+",
    minPriceNumber: 750000,
    organizerName: "SpaceSpeakers Label",
    description:
      "Đêm showcase giới thiệu album phòng thu mới của SOOBIN với toàn bộ bản phối live band cùng hiệu ứng ánh sáng laser hiện đại.",
    image: "/images/events/vn/soobin.jpg",
    trendingOrder: 2,
  },
  {
    id: "evt-vu-bao-tang-cua-nuoi-tiec",
    title: "Vũ. Bảo Tàng Của Nuối Tiếc",
    category: "CONCERT",
    dateRange: "CN, 30 Th11 • 20:00",
    fullDateTime: "CN, 30 Th11, 2026 • 20:00",
    doorsOpenTime: "18:00",
    dateWindow: "NOV",
    venue: "Nhà thi đấu Phú Thọ",
    venueAddress: "219 Lý Thường Kiệt, Phường 15, Quận 11, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    cityCode: "HCM",
    fromPrice: "650.000 ₫+",
    minPriceNumber: 650000,
    organizerName: "Warner Music Vietnam",
    description:
      "Concert tour quy mô lớn nhất sự nghiệp của Vũ. mang đến không gian trưng bày âm nhạc và những bản ballad đầy cảm xúc.",
    image: "/images/events/vn/vu.jpg",
    trendingOrder: 3,
  },
  {
    id: "evt-chi-dep-dap-gio-re-song",
    title: "Chị Đẹp Đạp Gió Rẽ Sóng",
    category: "FESTIVAL",
    dateRange: "CN, 14 Th12 • 19:00",
    fullDateTime: "CN, 14 Th12, 2026 • 19:00",
    doorsOpenTime: "17:00",
    dateWindow: "DEC",
    venue: "SECC Quận 7",
    venueAddress: "799 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    cityCode: "HCM",
    fromPrice: "700.000 ₫+",
    minPriceNumber: 700000,
    organizerName: "YeaH1 Live",
    description:
      "Đêm gala concert quy tụ 30 Chị Đẹp với các tiết mục trình diễn vũ đạo, vocal và sân khấu biến hóa đa chiều tại SECC Quận 7.",
    image: "/images/events/vn/hozo.jpg",
    trendingOrder: 4,
  },

  // Concerts Row
  {
    id: "evt-my-tam-tri-am",
    title: "Mỹ Tâm: Tri Âm Acoustic",
    category: "CONCERT",
    dateRange: "06 Th12 - 07 Th12",
    fullDateTime: "T7, 06 Th12, 2026 • 19:30",
    doorsOpenTime: "18:00",
    dateWindow: "DEC",
    venue: "Cung Tiên Sơn",
    venueAddress: "Đường Phan Đăng Lưu, Quận Hải Châu, Đà Nẵng",
    city: "Đà Nẵng",
    cityCode: "DN",
    fromPrice: "900.000 ₫+",
    minPriceNumber: 900000,
    organizerName: "MT Entertainment",
    description:
      "Đêm nhạc Tri Âm phiên bản Acoustic đặc biệt tại quê hương Đà Nẵng của ca sĩ Mỹ Tâm.",
    image: "/images/events/vn/my-tam.jpg",
  },
  {
    id: "evt-chillies-ca-hoi-hoang",
    title: "Chillies & Cá Hồi Hoang",
    category: "CONCERT",
    dateRange: "05 Th12 - 12 Th12",
    fullDateTime: "T6, 05 Th12, 2026 • 20:00",
    doorsOpenTime: "18:30",
    dateWindow: "DEC",
    venue: "Capital Theatre",
    venueAddress: "212 Lý Chính Thắng, Quận 3, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    cityCode: "HCM",
    fromPrice: "550.000 ₫+",
    minPriceNumber: 550000,
    organizerName: "Indie Vietnam Live",
    description:
      "Sự kết hợp đặc biệt trên cùng một sân khấu của hai đại diện tiêu biểu dòng nhạc Indie Pop & Alternative Rock Việt Nam.",
    image: "/images/events/vn/chillies.jpg",
  },
  {
    id: "evt-anh-trai-say-hi-live",
    title: "Anh Trai Say Hi: Concert Live",
    category: "CONCERT",
    dateRange: "22 Th11 - 28 Th11",
    fullDateTime: "T7, 22 Th11, 2026 • 19:00",
    doorsOpenTime: "16:30",
    dateWindow: "NOV",
    venue: "Vạn Phúc City",
    venueAddress: "Khu đô thị Vạn Phúc, Quốc lộ 13, TP. Thủ Đức, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    cityCode: "HCM",
    fromPrice: "850.000 ₫+",
    minPriceNumber: 850000,
    organizerName: "Vie Channel",
    description:
      "Đêm concert bùng nổ của dàn nghệ sĩ trẻ từ chương trình Anh Trai Say Hi với hàng loạt bản hit dẫn đầu bảng xếp hạng.",
    image: "/images/events/vn/tlinh.jpg",
  },
  {
    id: "evt-wren-evans-loi-choi",
    title: "Wren Evans: LOI CHOI Live",
    category: "CONCERT",
    dateRange: "13 Th12 - 20 Th12",
    fullDateTime: "T7, 13 Th12, 2026 • 20:00",
    doorsOpenTime: "18:30",
    dateWindow: "DEC",
    venue: "Nhà thi đấu Nguyễn Du",
    venueAddress: "116 Nguyễn Du, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    cityCode: "HCM",
    fromPrice: "600.000 ₫+",
    minPriceNumber: 600000,
    organizerName: "monoX Agency",
    description:
      "Tour diễn cá nhân đầu tiên của Wren Evans trình diễn trọn vẹn album LOI CHOI cùng ban nhạc quốc tế.",
    image: "/images/events/vn/indie-saigon.jpg",
  },

  // Sports Row
  {
    id: "evt-vleague-cahn-namdinh",
    title: "Công An Hà Nội vs. Nam Định FC",
    category: "SPORT",
    dateRange: "CN, 23 Th11 • 19:15",
    fullDateTime: "CN, 23 Th11, 2026 • 19:15",
    doorsOpenTime: "17:30",
    dateWindow: "WEEKEND",
    venue: "SVĐ Hàng Đẫy",
    venueAddress: "9 Trịnh Hoài Đức, Quận Đống Đa, Hà Nội",
    city: "Hà Nội",
    cityCode: "HN",
    fromPrice: "150.000 ₫+",
    minPriceNumber: 150000,
    organizerName: "VPF & CLB Công An Hà Nội",
    description:
      "Tâm điểm vòng 9 V.League 1 giữa CLB Công An Hà Nội và nhà đương kim vô địch Thép Xanh Nam Định tại SVĐ Hàng Đẫy.",
    image: "/images/events/vn/vleague-cahn.jpg",
  },
  {
    id: "evt-vba-finals-saigon-heat",
    title: "Saigon Heat vs. Hanoi Buffaloes",
    category: "SPORT",
    dateRange: "CN, 16 Th11 • 19:30",
    fullDateTime: "CN, 16 Th11, 2026 • 19:30",
    doorsOpenTime: "18:00",
    dateWindow: "WEEKEND",
    venue: "Nhà thi đấu CIS Quận 7",
    venueAddress: "Số 86 Đường 23, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    cityCode: "HCM",
    fromPrice: "250.000 ₫+",
    minPriceNumber: 250000,
    organizerName: "VBA - Giải Bóng Rổ Chuyên Nghiệp Việt Nam",
    description:
      "Trận chung kết kịch tính của mùa giải VBA giữa Saigon Heat và Hanoi Buffaloes tại chảo lửa CIS Arena.",
    image: "/images/events/vn/saigon-heat.jpg",
  },
  {
    id: "evt-giao-huu-vietnam-allstars",
    title: "Đội Tuyển Việt Nam vs. All-Stars",
    category: "SPORT",
    dateRange: "T7, 13 Th12 • 19:00",
    fullDateTime: "T7, 13 Th12, 2026 • 19:00",
    doorsOpenTime: "17:00",
    dateWindow: "DEC",
    venue: "SVĐ Quốc gia Mỹ Đình",
    venueAddress: "1 Lê Đức Thọ, Quận Nam Từ Liêm, Hà Nội",
    city: "Hà Nội",
    cityCode: "HN",
    fromPrice: "300.000 ₫+",
    minPriceNumber: 300000,
    organizerName: "Liên đoàn Bóng đá Việt Nam (VFF)",
    description:
      "Trận cầu giao hữu quốc tế trên SVĐ Quốc gia Mỹ Đình tiếp lửa cho Đội tuyển Quốc gia Việt Nam.",
    image: "/images/events/vn/vietnam-football.jpg",
  },
  {
    id: "evt-vleague-thecong-hanoi",
    title: "Thể Công Viettel vs. Hà Nội FC",
    category: "SPORT",
    dateRange: "T7, 29 Th11 • 19:15",
    fullDateTime: "T7, 29 Th11, 2026 • 19:15",
    doorsOpenTime: "17:30",
    dateWindow: "NOV",
    venue: "SVĐ Quốc gia Mỹ Đình",
    venueAddress: "1 Lê Đức Thọ, Quận Nam Từ Liêm, Hà Nội",
    city: "Hà Nội",
    cityCode: "HN",
    fromPrice: "180.000 ₫+",
    minPriceNumber: 180000,
    organizerName: "VPF & CLB Thể Công Viettel",
    description:
      "Trận derby Thủ đô rực lửa giữa Thể Công Viettel và Hà Nội FC trong khuôn khổ giải vô địch quốc gia V.League.",
    image: "/images/events/vn/thecong-hanoi.jpg",
  },

  // Theater & Comedy Row
  {
    id: "evt-ky-uc-hoi-an-show",
    title: "Show Thực Cảnh Ký Ức Hội An",
    category: "THEATER",
    dateRange: "16 Th11 - 30 Th11",
    fullDateTime: "CN, 16 Th11, 2026 • 20:00",
    doorsOpenTime: "18:30",
    dateWindow: "WEEKEND",
    venue: "Đảo Ký Ức Hội An",
    venueAddress: "200 Nguyễn Tri Phương, Cẩm Nam, Hội An, Quảng Nam - Đà Nẵng",
    city: "Đà Nẵng",
    cityCode: "DN",
    fromPrice: "400.000 ₫+",
    minPriceNumber: 400000,
    organizerName: "Hoi An Memories Land",
    description:
      "Chương trình biểu diễn nghệ thuật thực cảnh ngoài trời quy tụ 500 diễn viên trên sân khấu rộng 25.000 m² tái hiện thương cảng Hội An 400 năm.",
    image: "/images/events/vn/kich-idecaf.jpg",
  },
  {
    id: "evt-giao-huong-ghibli-hanoi",
    title: "Dàn Nhạc Giao Hưởng Hà Nội",
    category: "THEATER",
    dateRange: "22 Th11 - 23 Th11",
    fullDateTime: "T7, 22 Th11, 2026 • 20:00",
    doorsOpenTime: "19:00",
    dateWindow: "NOV",
    venue: "Nhà hát Hồ Gươm",
    venueAddress: "40 Hàng Bài, Quận Hoàn Kiếm, Hà Nội",
    city: "Hà Nội",
    cityCode: "HN",
    fromPrice: "600.000 ₫+",
    minPriceNumber: 600000,
    organizerName: "Hanoi Philharmonic Orchestra",
    description:
      "Đêm hòa nhạc giao hưởng thính phòng trình diễn các tác phẩm kinh điển tại khán phòng tiêu chuẩn quốc tế Nhà hát Hồ Gươm.",
    image: "/images/events/vn/dan-nhac-giao-huong.jpg",
  },
  {
    id: "evt-saigon-teu-standup",
    title: "Sài Gòn Tếu Stand-up Comedy",
    category: "THEATER",
    dateRange: "28 Th11 - 05 Th12",
    fullDateTime: "T6, 28 Th11, 2026 • 20:30",
    doorsOpenTime: "19:30",
    dateWindow: "NOV",
    venue: "Sân khấu C30 Hòa Bình",
    venueAddress: "141 Bắc Hải, Phường 14, Quận 10, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    cityCode: "HCM",
    fromPrice: "220.000 ₫+",
    minPriceNumber: 220000,
    organizerName: "Sài Gòn Tếu Comedy Club",
    description:
      "Đêm hài độc thoại trực tiếp với dàn diễn viên trẻ của Sài Gòn Tếu mang lại tiếng cười sảng khoái cuối tuần.",
    image: "/images/events/vn/saigon-teu.jpg",
  },
  {
    id: "evt-a-o-show-opera",
    title: "Vở Múa Đương Đại À Ố Show",
    category: "THEATER",
    dateRange: "06 Th12 - 20 Th12",
    fullDateTime: "T7, 06 Th12, 2026 • 18:00",
    doorsOpenTime: "17:15",
    dateWindow: "DEC",
    venue: "Nhà hát Thành phố",
    venueAddress: "07 Công Trường Lam Sơn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    cityCode: "HCM",
    fromPrice: "700.000 ₫+",
    minPriceNumber: 700000,
    organizerName: "Lune Production",
    description:
      "Xiếc tre mới kết hợp múa đương đại và âm nhạc dân tộc sống động khắc họa nét đẹp văn hóa làng quê và đô thị Việt Nam.",
    image: "/images/events/vn/a-o-show.jpg",
  },
];

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")} ₫`;
}

export function getEventById(id: string): EventItem | undefined {
  return EVENTS.find((ev) => ev.id === id);
}

/**
 * Deterministic hash so SSR and CSR always render the exact same seat availability
 */
function deterministicSeatStatus(
  eventId: string,
  zoneId: string,
  rowLabel: string,
  seatIndex: number
): SeatStatus {
  const seed = `${eventId}:${zoneId}:${rowLabel}:${seatIndex}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 10007;
  }
  const mod = hash % 20;
  if (mod === 0 || mod === 1 || mod === 2) return "SOLD";
  if (mod === 3 || mod === 4) return "HELD";
  return "AVAILABLE";
}

function buildRows(
  eventId: string,
  zoneId: string,
  zoneName: string,
  rowLabels: string[],
  seatsPerRow: number,
  price: number
): SeatRow[] {
  return rowLabels.map((rowLabel) => {
    const seats: SeatItem[] = [];
    for (let i = 1; i <= seatsPerRow; i++) {
      const seatNumber = String(i).padStart(2, "0");
      seats.push({
        id: `${eventId}-${zoneId}-${rowLabel}-${seatNumber}`,
        seatNumber,
        rowLabel,
        zoneId,
        zoneName,
        status: deterministicSeatStatus(eventId, zoneId, rowLabel, i),
        price,
      });
    }
    return { rowLabel, seats };
  });
}

function countAvailableSeats(rows: SeatRow[]): number {
  return rows.reduce(
    (sum, r) => sum + r.seats.filter((s) => s.status === "AVAILABLE").length,
    0
  );
}

export function getEventSeatMap(event: EventItem): EventZone[] {
  const base = event.minPriceNumber;

  if (event.category === "SPORT") {
    const vipPrice = Math.round((base * 2.5) / 10000) * 10000;
    const cat1Price = Math.round((base * 1.8) / 10000) * 10000;
    const standingPrice = Math.round((base * 1.2) / 10000) * 10000;
    const cat2Price = base;

    const vipALeftRows = buildRows(
      event.id,
      "zone-vip-a",
      "Khán đài A VIP (Tây)",
      ["A", "B", "C", "D"],
      10,
      vipPrice
    );
    const vipBRightRows = buildRows(
      event.id,
      "zone-vip-b",
      "Khán đài A1 (Đông)",
      ["A", "B", "C", "D"],
      10,
      cat1Price
    );
    const lowerRows = buildRows(
      event.id,
      "zone-lower",
      "Khán đài B Trung tâm",
      ["E", "F", "G", "H"],
      14,
      cat1Price
    );
    const upperRows = buildRows(
      event.id,
      "zone-upper",
      "Khán đài C & D Phổ thông",
      ["J", "K", "L"],
      14,
      cat2Price
    );

    return [
      {
        zoneId: "zone-vip-a",
        zoneName: "Khán đài A VIP (Tây)",
        description: "Ghế ngồi có mái che, tầm nhìn trực diện vạch giữa sân",
        isSeated: true,
        ticketTypeId: `tt-${event.id}-vip-a`,
        price: vipPrice,
        maxPerOrder: 6,
        availableCount: countAvailableSeats(vipALeftRows),
        rows: vipALeftRows,
        layoutPosition: "FRONT_LEFT",
      },
      {
        zoneId: "zone-vip-b",
        zoneName: "Khán đài A1 (Đông)",
        description: "Ghế ngồi tiêu chuẩn khu vực khán đài A, lối vào cổng ưu tiên",
        isSeated: true,
        ticketTypeId: `tt-${event.id}-vip-b`,
        price: cat1Price,
        maxPerOrder: 6,
        availableCount: countAvailableSeats(vipBRightRows),
        rows: vipBRightRows,
        layoutPosition: "FRONT_RIGHT",
      },
      {
        zoneId: "zone-standing",
        zoneName: "Khu Hội Cổ Động Viên (Vé đứng)",
        description: "Khu vực cổ vũ sôi động phía sau cầu môn, không đánh số ghế",
        isSeated: false,
        ticketTypeId: `tt-${event.id}-standing`,
        price: standingPrice,
        maxPerOrder: 6,
        availableCount: 96,
        rows: [],
        layoutPosition: "CENTER_STANDING",
      },
      {
        zoneId: "zone-lower",
        zoneName: "Khán đài B Trung tâm",
        description: "Ghế ngồi đánh số tầm nhìn toàn cảnh mặt sân thi đấu",
        isSeated: true,
        ticketTypeId: `tt-${event.id}-lower`,
        price: cat1Price,
        maxPerOrder: 6,
        availableCount: countAvailableSeats(lowerRows),
        rows: lowerRows,
        layoutPosition: "LOWER_TIER",
      },
      {
        zoneId: "zone-upper",
        zoneName: "Khán đài C & D Phổ thông",
        description: "Ghế ngồi tầng cao giá tiết kiệm, góc nhìn bao quát",
        isSeated: true,
        ticketTypeId: `tt-${event.id}-upper`,
        price: cat2Price,
        maxPerOrder: 6,
        availableCount: countAvailableSeats(upperRows),
        rows: upperRows,
        layoutPosition: "UPPER_TIER",
      },
    ];
  }

  if (event.category === "THEATER") {
    const vipPrice = Math.round((base * 2.2) / 50000) * 50000;
    const parterrePrice = Math.round((base * 1.5) / 50000) * 50000;
    const balconyPrice = base;

    const vipLeftRows = buildRows(
      event.id,
      "zone-vip-a",
      "Hạng Nhất VIP (Trái)",
      ["A", "B", "C", "D"],
      10,
      vipPrice
    );
    const vipRightRows = buildRows(
      event.id,
      "zone-vip-b",
      "Hạng Nhất VIP (Phải)",
      ["A", "B", "C", "D"],
      10,
      vipPrice
    );
    const lowerRows = buildRows(
      event.id,
      "zone-lower",
      "Hạng Nhì (Khán phòng chính)",
      ["E", "F", "G", "H"],
      14,
      parterrePrice
    );
    const upperRows = buildRows(
      event.id,
      "zone-upper",
      "Hạng Ba (Ban công tầng 2)",
      ["J", "K", "L"],
      14,
      balconyPrice
    );

    return [
      {
        zoneId: "zone-vip-a",
        zoneName: "Hạng Nhất VIP (Trái)",
        description: "Hàng ghế đầu sát sân khấu, âm thanh và tầm nhìn tốt nhất",
        isSeated: true,
        ticketTypeId: `tt-${event.id}-vip-a`,
        price: vipPrice,
        maxPerOrder: 6,
        availableCount: countAvailableSeats(vipLeftRows),
        rows: vipLeftRows,
        layoutPosition: "FRONT_LEFT",
      },
      {
        zoneId: "zone-vip-b",
        zoneName: "Hạng Nhất VIP (Phải)",
        description: "Hàng ghế đầu sát sân khấu, tặng kèm chương trình lưu niệm",
        isSeated: true,
        ticketTypeId: `tt-${event.id}-vip-b`,
        price: vipPrice,
        maxPerOrder: 6,
        availableCount: countAvailableSeats(vipRightRows),
        rows: vipRightRows,
        layoutPosition: "FRONT_RIGHT",
      },
      {
        zoneId: "zone-lower",
        zoneName: "Hạng Nhì (Khán phòng chính)",
        description: "Ghế ngồi trung tâm tầng 1 với góc nhìn cân đối",
        isSeated: true,
        ticketTypeId: `tt-${event.id}-lower`,
        price: parterrePrice,
        maxPerOrder: 6,
        availableCount: countAvailableSeats(lowerRows),
        rows: lowerRows,
        layoutPosition: "LOWER_TIER",
      },
      {
        zoneId: "zone-upper",
        zoneName: "Hạng Ba (Ban công tầng 2)",
        description: "Ghế ngồi ban công tầng 2 nhìn bao quát toàn bộ sân khấu",
        isSeated: true,
        ticketTypeId: `tt-${event.id}-upper`,
        price: balconyPrice,
        maxPerOrder: 6,
        availableCount: countAvailableSeats(upperRows),
        rows: upperRows,
        layoutPosition: "UPPER_TIER",
      },
    ];
  }

  // Default: CONCERT & FESTIVAL
  const svipPrice = Math.round((base * 2.8) / 50000) * 50000;
  const fanzonePrice = Math.round((base * 1.75) / 50000) * 50000;
  const cat1Price = Math.round((base * 1.35) / 50000) * 50000;
  const cat2Price = base;

  const vipARows = buildRows(
    event.id,
    "zone-vip-a",
    "Khu VIP A (Ngồi)",
    ["A", "B", "C", "D"],
    10,
    svipPrice
  );
  const vipBRows = buildRows(
    event.id,
    "zone-vip-b",
    "Khu VIP B (Ngồi)",
    ["A", "B", "C", "D"],
    10,
    svipPrice
  );
  const lowerRows = buildRows(
    event.id,
    "zone-lower",
    "Khán đài Hạng A (CAT 1)",
    ["E", "F", "G", "H"],
    14,
    cat1Price
  );
  const upperRows = buildRows(
    event.id,
    "zone-upper",
    "Khán đài Phổ thông (CAT 2)",
    ["J", "K", "L"],
    14,
    cat2Price
  );

  return [
    {
      zoneId: "zone-vip-a",
      zoneName: "Khu VIP A (Ngồi)",
      description:
        "Ghế ngồi đánh số sát sân khấu cánh trái, kèm bộ quà tặng lightstick và lối check-in riêng",
      isSeated: true,
      ticketTypeId: `tt-${event.id}-vip-a`,
      price: svipPrice,
      maxPerOrder: 6,
      availableCount: countAvailableSeats(vipARows),
      rows: vipARows,
      layoutPosition: "FRONT_LEFT",
    },
    {
      zoneId: "zone-vip-b",
      zoneName: "Khu VIP B (Ngồi)",
      description:
        "Ghế ngồi đánh số sát sân khấu cánh phải, kèm bộ quà tặng lightstick và lối check-in riêng",
      isSeated: true,
      ticketTypeId: `tt-${event.id}-vip-b`,
      price: svipPrice,
      maxPerOrder: 6,
      availableCount: countAvailableSeats(vipBRows),
      rows: vipBRows,
      layoutPosition: "FRONT_RIGHT",
    },
    {
      zoneId: "zone-standing",
      zoneName: "Fanzone Đứng (GA)",
      description:
        "Khu vực vé đứng sát đường dẫn catwalk trung tâm, tự do di chuyển trong khu vực Fanzone",
      isSeated: false,
      ticketTypeId: `tt-${event.id}-standing`,
      price: fanzonePrice,
      maxPerOrder: 6,
      availableCount: 84,
      rows: [],
      layoutPosition: "CENTER_STANDING",
    },
    {
      zoneId: "zone-lower",
      zoneName: "Khán đài Hạng A (CAT 1)",
      description: "Ghế ngồi tầng 1 tầm nhìn trực diện sân khấu chính",
      isSeated: true,
      ticketTypeId: `tt-${event.id}-lower`,
      price: cat1Price,
      maxPerOrder: 6,
      availableCount: countAvailableSeats(lowerRows),
      rows: lowerRows,
      layoutPosition: "LOWER_TIER",
    },
    {
      zoneId: "zone-upper",
      zoneName: "Khán đài Phổ thông (CAT 2)",
      description: "Ghế ngồi khán đài tầng 2 bao quát toàn bộ hiệu ứng ánh sáng",
      isSeated: true,
      ticketTypeId: `tt-${event.id}-upper`,
      price: cat2Price,
      maxPerOrder: 6,
      availableCount: countAvailableSeats(upperRows),
      rows: upperRows,
      layoutPosition: "UPPER_TIER",
    },
  ];
}
