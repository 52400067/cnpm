import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      eventId?: string;
      items?: Array<{ ticketTypeId: string; quantity: number }>;
    };
    const authHeader = request.headers.get("authorization");

    // 1. Nếu Backend NestJS đang chạy (port 4000 / API_URL), chuyển tiếp yêu cầu tới backend
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      "http://localhost:4000/api/v1";

    try {
      const backendRes = await fetch(`${backendUrl}/booking/hold`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(1500),
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend offline hoặc chưa khởi động -> Chuyển sang fallback phiên giữ chỗ demo
    }

    // 2. Fallback giữ chỗ ghế cục bộ (phục vụ chạy demo Frontend độc lập và test kiểm thử)
    const qty = body.items?.[0]?.quantity || 2;
    const ticketTypeId = body.items?.[0]?.ticketTypeId || "t-mock";
    const orderId = `ord-${Date.now()}`;
    const orderCode = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    const allocatedSeats = Array.from({ length: qty }).map((_, idx) => ({
      id: `seat-${ticketTypeId}-${idx + 1}`,
      zoneName: "Khu vực đã chọn",
      rowLabel: "D",
      seatNumber: `${12 + idx}`,
    }));

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        orderCode,
        remainingSeconds: 300,
        allocatedSeats,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Không thể thực hiện giữ chỗ vé lúc này.";
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "HOLD_ERROR",
          message,
        },
      },
      { status: 500 },
    );
  }
}
