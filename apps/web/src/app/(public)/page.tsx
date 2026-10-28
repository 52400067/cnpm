// apps/web/src/app/(public)/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeDiscoveryClient } from "@/components/home/home-discovery-client";
import type { CategoryCode } from "@/lib/events-catalog";

export const metadata: Metadata = {
  title: "TicketHub Vietnam | Mua vé Hòa nhạc, Thể thao & Sân khấu chính thức",
  description:
    "Tìm kiếm và đặt vé chính thức 100% các đêm nhạc, liveshow, giải bóng đá V.League, VBA và sân khấu kịch trên toàn quốc.",
  openGraph: {
    title: "TicketHub Vietnam | Nền tảng phân phối vé sự kiện trực tiếp",
    description:
      "Khám phá và đặt vé chính thức các đêm nhạc, liveshow, kịch sân khấu và giải đấu thể thao trên toàn quốc.",
    type: "website",
    locale: "vi_VN",
    siteName: "TicketHub Vietnam",
    images: [
      {
        url: "/images/events/vn/anh-trai.jpg",
        width: 1200,
        height: 630,
        alt: "TicketHub Vietnam - Sự kiện nổi bật",
      },
    ],
  },
};

type SearchParamsPromise = Promise<{
  q?: string;
  category?: string;
  city?: string;
  price?: string;
  fromDate?: string;
  toDate?: string;
}>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}) {
  const resolved = await searchParams;

  const validCategories: CategoryCode[] = [
    "ALL",
    "CONCERT",
    "SPORT",
    "THEATER",
    "FESTIVAL",
  ];
  const initialCategory: CategoryCode = validCategories.includes(
    resolved.category as CategoryCode,
  )
    ? (resolved.category as CategoryCode)
    : "ALL";

  const validCities = ["ALL", "HCM", "HN", "DN"] as const;
  const initialCity = validCities.includes(resolved.city as any)
    ? (resolved.city as "ALL" | "HCM" | "HN" | "DN")
    : "HCM";

  return (
    <Suspense
      fallback={
        <div className="max-w-[1200px] mx-auto px-6 py-12 text-sm text-[#606970]">
          Đang tải danh sách sự kiện...
        </div>
      }
    >
      <HomeDiscoveryClient
        initialKeyword={resolved.q || ""}
        initialCategory={initialCategory}
        initialCity={initialCity}
        initialPriceRange={resolved.price || "ALL"}
        initialFromDate={resolved.fromDate || ""}
        initialToDate={resolved.toDate || ""}
      />
    </Suspense>
  );
}