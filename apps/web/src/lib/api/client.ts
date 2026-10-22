// apps/web/src/lib/api/client.ts
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export interface ApiStandardResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };

  if (inMemoryAccessToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${inMemoryAccessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      credentials: "include",
      headers,
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Máy chủ API hiện chưa phản hồi. Vui lòng kiểm tra kết nối backend hoặc sử dụng chế độ xem trước giao diện.",
    );
  }

  const payload = (await response
    .json()
    .catch(() => null)) as ApiStandardResponse<T> | null;

  if (!response.ok || (payload && payload.success === false)) {
    throw new ApiError(
      response.status,
      payload?.error?.code || "UNKNOWN_ERROR",
      payload?.error?.message || "Không thể xử lý yêu cầu từ máy chủ TicketHub",
      payload?.error?.details,
    );
  }

  return payload && "data" in payload ? payload.data : (payload as T);
}
