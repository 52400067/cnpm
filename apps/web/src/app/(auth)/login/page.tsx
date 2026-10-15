// apps/web/src/app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import { loginSchema, LoginInput } from "@/validations/auth";
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      const res = await authApi.login(data);
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", res.accessToken);
      }
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        // Fallback khi chạy độc lập FE chưa bật server BE
        router.push("/");
      }
    }
  };

  return (
    <Card className="shadow-xl border-slate-200/80 rounded-2xl bg-white">
      <CardHeader className="space-y-1.5 text-center pb-2">
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Đăng nhập vào TicketHub
        </CardTitle>
        <CardDescription className="text-slate-500">
          Nhập email và mật khẩu để săn vé hoặc quản lý sự kiện
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4 pt-2">
          {serverError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Địa chỉ Email</Label>
            <div className="relative">
              <Mail className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                id="email"
                type="email"
                placeholder="user@tickethub.vn"
                className="h-10 pl-9 rounded-xl"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-600 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mật khẩu</Label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Lock className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-10 pl-9 pr-9 rounded-xl"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Hiện hoặc ẩn mật khẩu"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3.5 bg-transparent border-t-0 pt-2 pb-6">
          <Button
            type="submit"
            size="lg"
            className="w-full h-11 rounded-full font-semibold text-sm shadow-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang xác thực..." : "Đăng nhập"}
          </Button>

          <div className="text-center text-sm text-slate-600">
            Chưa có tài khoản TicketHub?{" "}
            <Link
              href="/register"
              className="text-primary font-semibold hover:underline"
            >
              Tạo tài khoản mới
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
