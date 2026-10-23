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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className="border border-border rounded-xl bg-card text-card-foreground shadow-xs">
      <CardHeader className="space-y-1.5 text-center pb-2">
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          Đăng nhập
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Nhập email và mật khẩu để tiếp tục.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4 pt-2">
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

          {/* Email field */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-foreground">
              Địa chỉ Email
            </Label>
            <div className="relative">
              <Mail className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Ví dụ: nguyenan@example.com"
                className="h-11 pl-9 rounded-lg text-sm bg-background border-input text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p
                id="email-error"
                role="alert"
                className="flex items-center gap-1.5 text-xs text-destructive font-medium"
              >
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{errors.email.message}</span>
              </p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                Mật khẩu
              </Label>
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Lock className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                className="h-11 pl-9 pr-10 rounded-lg text-sm bg-background border-input text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p
                id="password-error"
                role="alert"
                className="flex items-center gap-1.5 text-xs text-destructive font-medium"
              >
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{errors.password.message}</span>
              </p>
            )}
          </div>

          {/* Remember me checkbox */}
          <div className="flex items-center gap-2 pt-0.5">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-4 rounded-xs border-border text-primary focus-visible:ring-2 focus-visible:ring-ring cursor-pointer accent-primary"
            />
            <label
              htmlFor="rememberMe"
              className="text-xs text-foreground cursor-pointer select-none font-medium"
            >
              Ghi nhớ đăng nhập
            </label>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3.5 bg-transparent border-t-0 pt-2 pb-6">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-lg font-semibold text-sm shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
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
        </CardFooter>
      </form>
    </Card>
  );
}
