// apps/web/src/app/(auth)/register/page.tsx
"use client";

import { Suspense, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  AlertCircle,
  Building2,
  Phone,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

function RegisterFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialRoleParam =
    searchParams.get("role") === UserRole.ORGANIZER
      ? UserRole.ORGANIZER
      : UserRole.BUYER;

  const [role, setRole] = useState<"BUYER" | "ORGANIZER">(initialRoleParam);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: initialRoleParam,
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      organizationName: "",
    },
  });

  useEffect(() => {
    setValue("role", initialRoleParam);
  }, [initialRoleParam, setValue]);

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
        setServerError(
          "Không thể kết nối tới máy chủ. Vui lòng thử lại sau ít phút.",
        );
      }
    }
  };

  return (
    <Card className="shadow-lg shadow-slate-900/5 border-slate-200/90 rounded-2xl bg-white">
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
            defaultValue={initialRoleParam}
            value={role}
            onValueChange={handleRoleChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-10 p-1 bg-slate-100 rounded-xl">
              <TabsTrigger
                value={UserRole.BUYER}
                className="rounded-lg text-xs sm:text-sm cursor-pointer"
              >
                Người Mua Vé
              </TabsTrigger>
              <TabsTrigger
                value={UserRole.ORGANIZER}
                className="rounded-lg text-xs sm:text-sm cursor-pointer"
              >
                Ban Tổ Chức (BTC)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700"
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="fullName">Họ và tên</Label>
            <div className="relative">
              <User className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="fullName"
                autoComplete="name"
                placeholder="Nguyễn Văn An"
                className="h-10 pl-9 rounded-xl"
                aria-invalid={!!errors.fullName}
                {...register("fullName")}
              />
            </div>
            {errors.fullName && (
              <p role="alert" className="text-xs text-red-600 font-medium">
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
                <Building2 className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="organizationName"
                  placeholder="Công ty Giải trí & Sự kiện XYZ"
                  className="h-10 pl-9 rounded-xl"
                  aria-invalid={!!errors.organizationName}
                  {...register("organizationName")}
                />
              </div>
              {errors.organizationName && (
                <p role="alert" className="text-xs text-red-600 font-medium">
                  {errors.organizationName.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Địa chỉ Email</Label>
            <div className="relative">
              <Mail className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="an.nguyen@email.com"
                className="h-10 pl-9 rounded-xl"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p role="alert" className="text-xs text-red-600 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="phone">Số điện thoại</Label>
              <span className="text-[11px] text-slate-400">Không bắt buộc</span>
            </div>
            <div className="relative">
              <Phone className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="0912345678"
                className="h-10 pl-9 rounded-xl font-mono"
                aria-invalid={!!errors.phone}
                {...register("phone")}
              />
            </div>
            {errors.phone && (
              <p role="alert" className="text-xs text-red-600 font-medium">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Lock className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Tối thiểu 8 ký tự"
                  className="h-10 pl-9 pr-8 rounded-xl"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <EyeOff className="size-3.5" />
                  ) : (
                    <Eye className="size-3.5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p role="alert" className="text-xs text-red-600 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Lock className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Nhập lại mật khẩu"
                  className="h-10 pl-9 rounded-xl"
                  aria-invalid={!!errors.confirmPassword}
                  {...register("confirmPassword")}
                />
              </div>
              {errors.confirmPassword && (
                <p role="alert" className="text-xs text-red-600 font-medium">
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
            className="w-full h-11 rounded-full font-semibold text-sm shadow-xs cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang tạo tài khoản..." : "Đăng ký ngay"}
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center text-sm text-slate-500 py-8">
          Đang tải...
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}
