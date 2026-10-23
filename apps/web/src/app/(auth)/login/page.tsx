// apps/web/src/app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@/validations/auth";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // TODO(contract): POST /api/v1/auth/login lacks rememberMe option; state handled on client.
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      await authApi.login(data);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError(
          "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại thông tin.",
        );
      }
    }
  };

  return (
    <div data-slot="auth-form" className="w-full flex flex-col gap-7">
      <header className="flex flex-col gap-2 text-left">
        <h1 className="text-[28px] leading-8 font-semibold tracking-tight text-foreground">
          Đăng nhập
        </h1>
        <p className="text-base text-muted-foreground leading-normal">
          Nhập email và mật khẩu để tiếp tục.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
        {/* Top-of-form server error alert */}
        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <div className="flex flex-col gap-5">
          {/* Email field */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Địa chỉ Email
            </Label>
            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <Mail className="size-5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-required="true"
                  placeholder="Ví dụ: nguyenan@example.com"
                  className={`h-12 pl-11 pr-3.5 rounded-lg text-base bg-background text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors ${
                    errors.email
                      ? "border-destructive focus-visible:border-destructive"
                      : "border border-muted-foreground hover:border-foreground"
                  }`}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p
                  id="email-error"
                  role="alert"
                  className="flex items-center gap-1.5 text-[13px] text-destructive font-medium"
                >
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between w-full">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Mật khẩu
              </Label>
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <Lock className="size-5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  aria-required="true"
                  placeholder="Nhập mật khẩu"
                  className={`h-12 pl-11 pr-11 rounded-lg text-base bg-background text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors ${
                    errors.password
                      ? "border-destructive focus-visible:border-destructive"
                      : "border border-muted-foreground hover:border-foreground"
                  }`}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs p-1"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  role="alert"
                  className="flex items-center gap-1.5 text-[13px] text-destructive font-medium"
                >
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>
          </div>

          {/* Remember me checkbox (whole row 44px click target, box >= 20px) */}
          <div id="rememberMe-row" className="h-11 flex items-center gap-3 select-none">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-5 rounded-xs border-muted-foreground text-primary focus-visible:ring-2 focus-visible:ring-ring cursor-pointer accent-primary shrink-0"
            />
            <label
              htmlFor="rememberMe"
              className="text-sm text-foreground font-medium cursor-pointer"
            >
              Ghi nhớ đăng nhập
            </label>
          </div>
        </div>

        {/* Submit & Switch Links */}
        <div className="flex flex-col gap-6">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-lg font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-5 animate-spin" />
                <span>Đang đăng nhập...</span>
              </span>
            ) : (
              "Đăng nhập"
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Chưa có tài khoản TicketHub?{" "}
            <Link
              href="/register"
              className="text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
            >
              Tạo tài khoản mới
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
