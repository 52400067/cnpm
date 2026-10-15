// apps/web/src/app/(auth)/register/page.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRole } from "@tickethub/shared";
import { registerSchema, RegisterInput } from "@/validations/auth";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Building2, Phone, User, Mail, Lock } from "lucide-react";

export default function RegisterPage() {
  const [role, setRole] = useState<"BUYER" | "ORGANIZER">(UserRole.BUYER);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: UserRole.BUYER,
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      organizationName: "",
    },
  });

  const handleRoleChange = (val: string) => {
    const selected = val as "BUYER" | "ORGANIZER";
    setRole(selected);
    setValue("role", selected, { shouldValidate: true });
  };

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone || undefined,
        role: data.role,
      });
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      }
    }
  };

  return (
    <Card className="shadow-xl border-slate-200/80 rounded-2xl bg-white">
      <CardHeader className="space-y-1.5 text-center pb-2">
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Tạo tài khoản TicketHub
        </CardTitle>
        <CardDescription className="text-slate-500">
          Chọn loại tài khoản phù hợp với nhu cầu của bạn
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-3.5 pt-2">
          <Tabs
            defaultValue={UserRole.BUYER}
            value={role}
            onValueChange={handleRoleChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-10 p-1 bg-slate-100 rounded-xl">
              <TabsTrigger
                value={UserRole.BUYER}
                className="rounded-lg text-xs sm:text-sm"
              >
                Người Mua Vé
              </TabsTrigger>
              <TabsTrigger
                value={UserRole.ORGANIZER}
                className="rounded-lg text-xs sm:text-sm"
              >
                Ban Tổ Chức (BTC)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {serverError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="fullName">Họ và tên</Label>
            <div className="relative">
              <User className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                id="fullName"
                placeholder="Nguyễn Văn An"
                className="h-10 pl-9 rounded-xl"
                aria-invalid={!!errors.fullName}
                {...register("fullName")}
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-red-600 font-medium">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {role === UserRole.ORGANIZER && (
            <div className="space-y-1.5">
              <Label htmlFor="organizationName">
                Tên Tổ chức / Doanh nghiệp
              </Label>
              <div className="relative">
                <Building2 className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="organizationName"
                  placeholder="Công ty Giải trí & Sự kiện XYZ"
                  className="h-10 pl-9 rounded-xl"
                  aria-invalid={!!errors.organizationName}
                  {...register("organizationName")}
                />
              </div>
              {errors.organizationName && (
                <p className="text-xs text-red-600 font-medium">
                  {errors.organizationName.message}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ten@vidu.com"
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
              <Label htmlFor="phone">Số điện thoại</Label>
              <div className="relative">
                <Phone className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0912345678"
                  className="h-10 pl-9 rounded-xl"
                  aria-invalid={!!errors.phone}
                  {...register("phone")}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-600 font-medium">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="password">Mật khẩu (tối thiểu 8 ký tự)</Label>
              <div className="relative">
                <Lock className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-10 pl-9 rounded-xl"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Lock className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="h-10 pl-9 rounded-xl"
                  aria-invalid={!!errors.confirmPassword}
                  {...register("confirmPassword")}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 font-medium">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3.5 bg-transparent border-t-0 pt-2 pb-6">
          <Button
            type="submit"
            size="lg"
            className="w-full h-11 rounded-full font-semibold text-sm shadow-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang khởi tạo tài khoản..." : "Đăng ký ngay"}
          </Button>

          <div className="text-center text-sm text-slate-600">
            Đã có tài khoản?{" "}
            <Link
              href="/login"
              className="text-primary font-semibold hover:underline"
            >
              Đăng nhập
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
