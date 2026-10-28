// apps/web/src/app/(public)/search/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPageClient } from "@/components/search/search-page-client";
import type { CategoryCode } from "@/lib/events-catalog";

type SearchParamsPromise = Promise<{
  q?: string;
  category?: string;
  city?: string;
  price?: string;
  fromDate?: string;
  toDate?: string;
}>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}): Promise<Metadata> {
  const resolved = await searchParams;
  const kw = resolved.q?.trim();

  return {
    title: kw
      ? `Tìm kiếm "${kw}" | Vé sự kiện chính thức TicketHub`
      : "Tìm kiếm sự kiện, hòa nhạc & thể thao | TicketHub Vietnam",
    description:
      "Tìm kiếm và lọc vé sự kiện theo thể loại, địa điểm, khoảng giá và ngày tổ chức trên TicketHub.",
  };
}

export default async function SearchPage({
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
    : "ALL";

  return (
    <Suspense
      fallback={
        <div className="max-w-[1200px] mx-auto px-6 py-12 text-sm text-[#606970]">
          Đang tải kết quả tìm kiếm...
        </div>
      }
    >
      <SearchPageClient
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