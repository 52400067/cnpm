// apps/web/src/app/(event)/events/[id]/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { EVENTS, getEventById } from "@/lib/events-catalog";
import { EventSplitView } from "@/components/events/event-detail-client";

type ParamsPromise = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: ParamsPromise;
}): Promise<Metadata> {
  const { id } = await params;
  const event = getEventById(id) ?? EVENTS[0]!;

  const title = `${event.title} (${event.dateRange}) | Vé chính thức TicketHub`;
  const description = `${event.description} Địa điểm: ${event.venue}, ${event.city}. Giá vé từ ${event.fromPrice}.`;

  return {
    metadataBase: new URL("http://localhost:3000"),
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/events/${event.id}`,
      siteName: "TicketHub Vietnam",
      locale: "vi_VN",
      type: "website",
      images: [
        {
          url: event.image,
          width: 1200,
          height: 630,
          alt: `${event.title} - ${event.venue}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [event.image],
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: ParamsPromise;
}) {
  const { id } = await params;
  const event = getEventById(id) ?? EVENTS[0]!;

  const ogTitle = `${event.title} (${event.dateRange}) | Vé chính thức TicketHub`;
  const ogDescription = `${event.description} Địa điểm: ${event.venue}, ${event.city}. Giá vé từ ${event.fromPrice}.`;

  return (
    <>
      {/* React 19 tự động hoist các thẻ meta Open Graph này vào <head> ngay khi SSR */}
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:image" content={event.image} />
      <meta property="og:type" content="website" />

      <Suspense
        fallback={
          <div className="h-screen flex items-center justify-center text-[13px] text-[#606970]">
            Đang tải sơ đồ sự kiện...
          </div>
        }
      >
        <EventSplitView key={event.id} event={event} />
      </Suspense>
    </>
  );
}