// apps/web/src/lib/api/auth.ts
import { apiClient, setAccessToken } from "./client";
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

export const authApi = {
  login: async (body: LoginRequest): Promise<LoginResponseData> => {
    const result = await apiClient<LoginResponseData>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (result?.accessToken) {
      setAccessToken(result.accessToken);
    }
    return result;
  },

  register: async (body: RegisterRequest): Promise<RegisterResponseData> => {
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
