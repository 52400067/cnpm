export type CategoryCode = "ALL" | "CONCERT" | "SPORT" | "THEATER" | "FESTIVAL";

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


import { VenueMapKey } from "./venue-svg.generated";

export interface TicketListing {
  id: string;
  eventId: string;
  zoneId: string;
  zoneName: string;
  section: string;
  row?: string;
  seatInfo: string;
  price: number;
  originalPrice?: number;
  availableTickets: number;
  dealScore: number;
  dealLabel: "Tuyệt vời" | "Rất tốt" | "Tốt";
  features: string[];
  viewFromSeatUrl: string;
  isLastTickets?: boolean;
  isStanding?: boolean;
}

export function getEventVenueMapKey(event: EventItem): VenueMapKey {
  if (event.category === "SPORT") {
    if (event.id.includes("vba") || event.id.includes("saigon-heat")) {
      return "arena-basketball";
    }
    return "stadium-football";
  }
  if (event.category === "THEATER") {
    return "theater";
  }
  if (
    event.id === "evt-ha-anh-tuan-sketch-a-rose" ||
    event.id === "evt-nhung-thanh-pho-mo-mang" ||
    event.id === "evt-my-tam-tri-am"
  ) {
    return "stadium-concert";
  }
  return "arena-t-stage";
}

export function getEventListings(event: EventItem): TicketListing[] {
  const mapKey = getEventVenueMapKey(event);
  const base = event.minPriceNumber;
  const roundVnd = (num: number) => Math.round(num / 10000) * 10000;

  if (mapKey === "arena-t-stage") {
    return [
      {
        id: `${event.id}-ult-vip`,
        eventId: event.id,
        zoneId: "5715",
        zoneName: "VIP Đặc Biệt",
        section: "VIP Đặc Biệt",
        row: "Hàng A",
        seatInfo: "Ghế 01 - 02",
        price: roundVnd(base * 2.8),
        originalPrice: roundVnd(base * 3.1),
        availableTickets: 2,
        dealScore: 10,
        dealLabel: "Tuyệt vời",
        features: ["2 vé ngồi cạnh nhau", "Gói VIP & Quà lưu niệm", "Lối vào ưu tiên"],
        viewFromSeatUrl: "/images/venues/view-concert-red.jpg",
        isLastTickets: true,
      },
      {
        id: `${event.id}-gold-vip`,
        eventId: event.id,
        zoneId: "27859",
        zoneName: "VIP Vàng",
        section: "VIP Vàng",
        row: "Hàng B",
        seatInfo: "Ghế 14 - 15",
        price: roundVnd(base * 2.4),
        availableTickets: 4,
        dealScore: 9,
        dealLabel: "Rất tốt",
        features: ["2 vé ngồi cạnh nhau", "Tầm nhìn trực diện sân khấu", "Quà tặng lightstick"],
        viewFromSeatUrl: "/images/venues/view-concert-red.jpg",
      },
      {
        id: `${event.id}-silver-vip`,
        eventId: event.id,
        zoneId: "2196",
        zoneName: "VIP Bạc",
        section: "VIP Bạc",
        row: "Hàng C",
        seatInfo: "Ghế 08 - 09",
        price: roundVnd(base * 2.0),
        availableTickets: 2,
        dealScore: 9,
        dealLabel: "Rất tốt",
        features: ["2 vé ngồi cạnh nhau", "Tầm nhìn không bị chắn", "Vòng tay check-in VIP"],
        viewFromSeatUrl: "/images/venues/view-concert-red.jpg",
        isLastTickets: true,
      },
      {
        id: `${event.id}-standing`,
        eventId: event.id,
        zoneId: "349",
        zoneName: "Khu Đứng Fanzone",
        section: "Khu Đứng Fanzone",
        seatInfo: "Vé đứng tự do sát catwalk",
        price: roundVnd(base * 1.55),
        availableTickets: 6,
        dealScore: 10,
        dealLabel: "Tuyệt vời",
        features: ["Khu vực đứng sát sàn diễn", "Tầm nhìn trực diện nghệ sĩ", "Tự do di chuyển"],
        viewFromSeatUrl: "/images/venues/view-concert-red.jpg",
        isStanding: true,
      },
      {
        id: `${event.id}-cat-a`,
        eventId: event.id,
        zoneId: "495",
        zoneName: "Hạng A",
        section: "Hạng A",
        row: "Hàng D",
        seatInfo: "Ghế 10 - 11",
        price: roundVnd(base * 1.35),
        availableTickets: 4,
        dealScore: 8,
        dealLabel: "Tốt",
        features: ["2 vé ngồi cạnh nhau", "Tầm nhìn khán đài trung tâm"],
        viewFromSeatUrl: "/images/venues/view-concert-red.jpg",
      },
      {
        id: `${event.id}-cat-b`,
        eventId: event.id,
        zoneId: "496",
        zoneName: "Hạng B",
        section: "Hạng B",
        row: "Hàng F",
        seatInfo: "Ghế 19 - 20",
        price: roundVnd(base * 1.15),
        availableTickets: 4,
        dealScore: 8,
        dealLabel: "Tốt",
        features: ["2 vé ngồi cạnh nhau", "Tầm nhìn bao quát sân khấu"],
        viewFromSeatUrl: "/images/venues/view-concert-red.jpg",
      },
      {
        id: `${event.id}-cat-c`,
        eventId: event.id,
        zoneId: "497",
        zoneName: "Hạng C",
        section: "Hạng C",
        row: "Hàng H",
        seatInfo: "Ghế 05 - 06",
        price: roundVnd(base * 1.0),
        availableTickets: 4,
        dealScore: 8,
        dealLabel: "Tốt",
        features: ["2 vé ngồi cạnh nhau", "Giá vé tiết kiệm"],
        viewFromSeatUrl: "/images/venues/view-concert-red.jpg",
      },
      {
        id: `${event.id}-cat-d`,
        eventId: event.id,
        zoneId: "504",
        zoneName: "Hạng D",
        section: "Hạng D",
        row: "Hàng K",
        seatInfo: "Ghế 12 - 13",
        price: roundVnd(base * 0.85),
        availableTickets: 2,
        dealScore: 9,
        dealLabel: "Rất tốt",
        features: ["2 vé ngồi cạnh nhau", "Góc nhìn khán đài tầng trên"],
        viewFromSeatUrl: "/images/venues/view-concert-red.jpg",
      },
    ];
  }

  if (mapKey === "stadium-concert") {
    return [
      {
        id: `${event.id}-priority-standing`,
        eventId: event.id,
        zoneId: "11448",
        zoneName: "Khu Đứng Ưu Tiên",
        section: "Khu Đứng Ưu Tiên",
        seatInfo: "Khu vực ưu tiên sát sân khấu",
        price: roundVnd(base * 2.2),
        availableTickets: 4,
        dealScore: 10,
        dealLabel: "Tuyệt vời",
        features: ["Vào cửa sớm trước 30 phút", "Khu đứng sát vách sân khấu chính", "Quà lưu niệm"],
        viewFromSeatUrl: "/images/venues/view-stadium-wide.jpg",
        isLastTickets: true,
        isStanding: true,
      },
      {
        id: `${event.id}-standing-pen`,
        eventId: event.id,
        zoneId: "682",
        zoneName: "Khu Đứng Sân Cỏ",
        section: "Khu Đứng Sân Cỏ",
        seatInfo: "Vé đứng tự do lòng sân vận động",
        price: roundVnd(base * 1.6),
        availableTickets: 6,
        dealScore: 9,
        dealLabel: "Rất tốt",
        features: ["Không khí cuồng nhiệt", "Tự do chọn vị trí đứng"],
        viewFromSeatUrl: "/images/venues/view-stadium-wide.jpg",
        isStanding: true,
      },
      {
        id: `${event.id}-lvl-100`,
        eventId: event.id,
        zoneId: "520",
        zoneName: "Khán Đài Tầng 100",
        section: "Khán đài Tầng 100 - Khu 140",
        row: "Hàng E",
        seatInfo: "Ghế 04 - 05",
        price: roundVnd(base * 1.4),
        availableTickets: 4,
        dealScore: 8,
        dealLabel: "Tốt",
        features: ["2 vé ngồi cạnh nhau", "Tầm nhìn trực diện sân khấu"],
        viewFromSeatUrl: "/images/venues/view-stadium-wide.jpg",
      },
      {
        id: `${event.id}-lvl-400`,
        eventId: event.id,
        zoneId: "782",
        zoneName: "Khán Đài Tầng 400",
        section: "Khán đài Tầng 400 - Khu 410",
        row: "Hàng M",
        seatInfo: "Ghế 12 - 13",
        price: roundVnd(base * 1.0),
        availableTickets: 4,
        dealScore: 9,
        dealLabel: "Rất tốt",
        features: ["2 vé ngồi cạnh nhau", "Toàn cảnh hiệu ứng ánh sáng"],
        viewFromSeatUrl: "/images/venues/view-stadium-wide.jpg",
      },
      {
        id: `${event.id}-lvl-600`,
        eventId: event.id,
        zoneId: "1219",
        zoneName: "Khán Đài Tầng 600",
        section: "Khán đài Tầng 600 - Khu 612",
        row: "Hàng R",
        seatInfo: "Ghế 08 - 09",
        price: roundVnd(base * 0.75),
        availableTickets: 4,
        dealScore: 8,
        dealLabel: "Tốt",
        features: ["2 vé ngồi cạnh nhau", "Giá vé tiết kiệm nhất"],
        viewFromSeatUrl: "/images/venues/view-stadium-wide.jpg",
      },
    ];
  }

  if (mapKey === "stadium-football") {
    return [
      {
        id: `${event.id}-stand-a-vip`,
        eventId: event.id,
        zoneId: "520",
        zoneName: "Khán Đài A (Tây) VIP",
        section: "Khán đài A - Khu 145",
        row: "Hàng D",
        seatInfo: "Ghế 12 - 13",
        price: roundVnd(base * 2.2),
        originalPrice: roundVnd(base * 2.5),
        availableTickets: 2,
        dealScore: 10,
        dealLabel: "Tuyệt vời",
        features: ["2 vé ngồi cạnh nhau", "Ghế có mái che", "Tầm nhìn vạch giữa sân"],
        viewFromSeatUrl: "/images/venues/view-stadium-wide.jpg",
        isLastTickets: true,
      },
      {
        id: `${event.id}-stand-b`,
        eventId: event.id,
        zoneId: "520",
        zoneName: "Khán Đài B (Đông)",
        section: "Khán đài B - Khu 112",
        row: "Hàng J",
        seatInfo: "Ghế 08 - 09",
        price: roundVnd(base * 1.4),
        availableTickets: 4,
        dealScore: 9,
        dealLabel: "Rất tốt",
        features: ["2 vé ngồi cạnh nhau", "Khu hội cổ động viên sôi động"],
        viewFromSeatUrl: "/images/venues/view-stadium-wide.jpg",
      },
      {
        id: `${event.id}-stand-cd-lvl2`,
        eventId: event.id,
        zoneId: "782",
        zoneName: "Khán Đài C & D (Tầng 2)",
        section: "Khán đài C - Khu 408",
        row: "Hàng G",
        seatInfo: "Ghế 15 - 16",
        price: roundVnd(base * 1.1),
        availableTickets: 4,
        dealScore: 8,
        dealLabel: "Tốt",
        features: ["2 vé ngồi cạnh nhau", "Tầm nhìn góc cầu môn"],
        viewFromSeatUrl: "/images/venues/view-stadium-wide.jpg",
      },
      {
        id: `${event.id}-stand-upper`,
        eventId: event.id,
        zoneId: "1219",
        zoneName: "Khán Đài Tầng Cao",
        section: "Khán đài D - Khu 610",
        row: "Hàng N",
        seatInfo: "Ghế 22 - 23",
        price: roundVnd(base * 1.0),
        availableTickets: 4,
        dealScore: 8,
        dealLabel: "Tốt",
        features: ["2 vé ngồi cạnh nhau", "Bao quát toàn bộ mặt cỏ"],
        viewFromSeatUrl: "/images/venues/view-stadium-wide.jpg",
      },
    ];
  }

  if (mapKey === "arena-basketball") {
    return [
      {
        id: `${event.id}-courtside`,
        eventId: event.id,
        zoneId: "682",
        zoneName: "Ghế Sát Sân",
        section: "Ghế Sát Sân - Khu 1",
        row: "Hàng 1",
        seatInfo: "Ghế 04 - 05",
        price: roundVnd(base * 2.8),
        availableTickets: 2,
        dealScore: 10,
        dealLabel: "Tuyệt vời",
        features: ["2 vé ngồi cạnh nhau", "Sát đường biên cầu thủ", "Phục vụ đồ uống tận nơi"],
        viewFromSeatUrl: "/images/venues/view-arena-1.jpg",
        isLastTickets: true,
      },
      {
        id: `${event.id}-club`,
        eventId: event.id,
        zoneId: "1724",
        zoneName: "Khu VIP Club",
        section: "Khán đài VIP - C109",
        row: "Hàng B",
        seatInfo: "Ghế 08 - 09",
        price: roundVnd(base * 2.0),
        availableTickets: 4,
        dealScore: 9,
        dealLabel: "Rất tốt",
        features: ["2 vé ngồi cạnh nhau", "Lối vào sảnh VIP riêng", "Ghế đệm êm ái"],
        viewFromSeatUrl: "/images/venues/view-arena-2.jpg",
      },
      {
        id: `${event.id}-lower-bowl`,
        eventId: event.id,
        zoneId: "594",
        zoneName: "Khán Đài Tầng 100",
        section: "Khu 120",
        row: "Hàng G",
        seatInfo: "Ghế 11 - 12",
        price: roundVnd(base * 1.4),
        availableTickets: 4,
        dealScore: 9,
        dealLabel: "Rất tốt",
        features: ["2 vé ngồi cạnh nhau", "Tầm nhìn trung tâm bảng rổ"],
        viewFromSeatUrl: "/images/venues/view-arena-3.jpg",
      },
      {
        id: `${event.id}-upper-bowl`,
        eventId: event.id,
        zoneId: "407",
        zoneName: "Khán Đài Tầng 200",
        section: "Khu 224",
        row: "Hàng K",
        seatInfo: "Ghế 16 - 17",
        price: roundVnd(base * 1.0),
        availableTickets: 4,
        dealScore: 8,
        dealLabel: "Tốt",
        features: ["2 vé ngồi cạnh nhau", "Giá vé phổ thông"],
        viewFromSeatUrl: "/images/venues/view-arena-3.jpg",
      },
    ];
  }

  // Theater
  return [
    {
      id: `${event.id}-theater-vip`,
      eventId: event.id,
      zoneId: "vip",
      zoneName: "VIP Sân Khấu",
      section: "VIP Trung tâm",
      row: "Hàng A",
      seatInfo: "Ghế 07 - 08",
      price: roundVnd(base * 2.2),
      availableTickets: 2,
      dealScore: 10,
      dealLabel: "Tuyệt vời",
      features: ["2 vé ngồi cạnh nhau", "Hàng đầu sát sân khấu", "Âm thanh thính phòng tốt nhất"],
      viewFromSeatUrl: "/images/venues/view-concert-red.jpg",
      isLastTickets: true,
    },
    {
      id: `${event.id}-theater-orch`,
      eventId: event.id,
      zoneId: "orch",
      zoneName: "Khán Phòng Chính (Hạng Nhì)",
      section: "Hạng Nhì - Cánh Giữa",
      row: "Hàng E",
      seatInfo: "Ghế 14 - 15",
      price: roundVnd(base * 1.4),
      availableTickets: 4,
      dealScore: 9,
      dealLabel: "Rất tốt",
      features: ["2 vé ngồi cạnh nhau", "Tầm nhìn trực diện cân đối"],
      viewFromSeatUrl: "/images/venues/view-concert-red.jpg",
    },
    {
      id: `${event.id}-theater-box`,
      eventId: event.id,
      zoneId: "box",
      zoneName: "Loge Khách Quý",
      section: "Loge L2",
      row: "Hàng 1",
      seatInfo: "Ghế 01 - 02",
      price: roundVnd(base * 1.7),
      availableTickets: 2,
      dealScore: 9,
      dealLabel: "Rất tốt",
      features: ["Không gian riêng tư", "Lối đi riêng cho khách quý"],
      viewFromSeatUrl: "/images/venues/view-concert-red.jpg",
      isLastTickets: true,
    },
    {
      id: `${event.id}-theater-balc`,
      eventId: event.id,
      zoneId: "balc",
      zoneName: "Ban Công Tầng 2",
      section: "Ban Công Giữa",
      row: "Hàng B",
      seatInfo: "Ghế 10 - 11",
      price: roundVnd(base * 1.0),
      availableTickets: 4,
      dealScore: 8,
      dealLabel: "Tốt",
      features: ["2 vé ngồi cạnh nhau", "Bao quát toàn cảnh sân khấu"],
      viewFromSeatUrl: "/images/venues/view-concert-red.jpg",
    },
  ];
}
