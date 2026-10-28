import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const authHeader = request.headers.get("authorization");
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      "http://localhost:4000/api/v1";

    try {
      await fetch(`${backendUrl}/booking/release`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(1500),
      });
    } catch {
      // Backend offline
    }

    return NextResponse.json({
      success: true,
      data: { released: true },
    });
  } catch {
    return NextResponse.json({ success: true, data: { released: true } });
  }
}
