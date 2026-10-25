// apps/web/src/lib/api/auth.ts
import { apiClient, setAccessToken, ApiError } from "./client";
import type {
  LoginRequest,
  RegisterRequest,
  VerifyEmailRequest,
  UserRole,
  UserStatus,
} from "@tickethub/shared";

export interface LoginResponseData {
  accessToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    status: UserStatus;
  };
}

export interface RegisterResponseData {
  userId: string;
  email: string;
  status: UserStatus;
  message: string;
}

export interface CheckIdentifierResult {
  exists: boolean;
  methods: ("password" | "otp" | "oauth")[];
}

export class AuthRateLimitError extends Error {
  status = 429;
  retryAfter: number;
  constructor(message: string, retryAfter = 30) {
    super(message);
    this.name = "AuthRateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class AuthNetworkError extends Error {
  status = 503;
  constructor(message: string) {
    super(message);
    this.name = "AuthNetworkError";
  }
}

// Feature flag for phone authentication
// TODO(contract): API_CONTRACT.md only supports email credentials in POST /api/v1/auth/login.
export const FEATURE_PHONE_AUTH = false;

export const authApi = {
  // TODO(contract): POST /api/v1/auth/check-identifier -> { exists: boolean, methods: [...] }
  // Endpoint not defined in API_CONTRACT.md. Implemented behind service layer with mock behavior.
  checkIdentifier: async (
    rawIdentifier: string,
  ): Promise<CheckIdentifierResult> => {
    const identifier = rawIdentifier.trim().toLowerCase();

    // Mock network latency (150ms)
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Mock edge case: Network error
    if (
      identifier === "error@example.com" ||
      identifier === "network-error@example.com" ||
      identifier.startsWith("error")
    ) {
      throw new AuthNetworkError(
        "Không thể kết nối đến máy chủ xác thực. Vui lòng kiểm tra mạng và thử lại.",
      );
    }

    // Mock edge case: Rate limit (429)
    if (
      identifier === "ratelimit@example.com" ||
      identifier === "429@example.com" ||
      identifier.startsWith("429")
    ) {
      throw new AuthRateLimitError(
        "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút",
        30,
      );
    }

    // Mock existing accounts (e.g. demo*, *existing.com, seed accounts)
    const knownExisting = [
      "buyer@tickethub.com",
      "organizer@tickethub.com",
      "admin@tickethub.com",
      "nguyenan@example.com",
      "existing@example.com",
    ];

    const exists =
      knownExisting.includes(identifier) ||
      identifier.startsWith("demo") ||
      identifier.endsWith("@existing.com") ||
      identifier.endsWith("@tickethub.com");

    return {
      exists,
      methods: ["password"],
    };
  },

  login: async (body: LoginRequest): Promise<LoginResponseData> => {
    const result = await apiClient<LoginResponseData>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (result?.accessToken) {
      setAccessToken(result.accessToken);
    }
    if (typeof document !== "undefined") {
      const isSecure =
        typeof window !== "undefined" && window.location.protocol === "https:";
      const secureFlag = isSecure ? "; Secure" : "";
      const maxAge = result.expiresIn || 900;
      document.cookie = `accessToken=${result.accessToken}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
      document.cookie = `th_role=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
      if (result?.user) {
        localStorage.setItem("tickethub_user", JSON.stringify(result.user));
      }
    }
    return result;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient("/auth/logout", { method: "POST" });
    } catch {
      // Bo qua neu backend chua bat
    } finally {
      setAccessToken(null);
      if (typeof document !== "undefined") {
        const isSecure =
          typeof window !== "undefined" &&
          window.location.protocol === "https:";
        const secureFlag = isSecure ? "; Secure" : "";
        document.cookie = `accessToken=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
        document.cookie = `th_role=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
        localStorage.removeItem("tickethub_user");
      }
    }
  },

  register: async (body: RegisterRequest): Promise<RegisterResponseData> => {
    if (body.email === "duplicate@example.com") {
      throw new ApiError(
        409,
        "CONFLICT",
        "Email này đã được sử dụng. Vui lòng đăng nhập.",
      );
    }

    return apiClient<RegisterResponseData>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  verifyEmail: async (
    body: VerifyEmailRequest,
  ): Promise<{ status: UserStatus }> => {
    return apiClient<{ status: UserStatus }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return apiClient<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
};
