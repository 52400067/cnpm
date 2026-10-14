import { apiClient } from "./client";
import type { LoginInput, RegisterInput } from "@/validations/auth";

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: "BUYER" | "ORGANIZER" | "ADMIN" | "GATE_STAFF";
  };
}

export const authApi = {
  login: async (body: LoginInput): Promise<AuthResponse> => {
    return apiClient<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  register: async (body: RegisterInput): Promise<{ message: string }> => {
    return apiClient<{ message: string }>("/auth/register", {
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

  verifyEmail: async (data: { email: string; otp: string }): Promise<{ message: string }> => {
    return apiClient<{ message: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};