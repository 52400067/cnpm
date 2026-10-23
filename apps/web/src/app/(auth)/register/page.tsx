// apps/web/src/app/(auth)/register/page.tsx
"use client";

import { Suspense, useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UserRole } from "@tickethub/shared";
import { registerSchema, type RegisterInput } from "@/validations/auth";
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
import {
  AlertCircle,
  Building2,
  Phone,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Check,
} from "lucide-react";
import { useAuthContext } from "@/components/auth/auth-context";

function RegisterFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setRoleTab } = useAuthContext();

  const initialRoleParam =
    searchParams.get("role") === UserRole.ORGANIZER
      ? UserRole.ORGANIZER
      : UserRole.BUYER;

  const [role, setRole] = useState<"BUYER" | "ORGANIZER">(initialRoleParam);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
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

  const watchedPassword = useWatch({ control, name: "password" });

  // Sync initial role with context panel
  useEffect(() => {
    setValue("role", initialRoleParam);
    setRoleTab(initialRoleParam);
  }, [initialRoleParam, setValue, setRoleTab]);

  const handleRoleChange = (selected: "BUYER" | "ORGANIZER") => {
    setRole(selected);
    setValue("role", selected, { shouldValidate: true });
    setRoleTab(selected);
  };

  const onSubmit = async (data: RegisterInput) => {
    if (!isAgreed) return;
    setServerError(null);

    // TODO(contract): API_CONTRACT.md lacks organizer-specific fields (companyPhone, taxCode) in POST /api/v1/auth/register.
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
          "Không thể tạo tài khoản lúc này. Vui lòng thử lại sau ít phút.",
        );
      }
    }
  };

  return (
    <Card className="border border-border rounded-xl bg-card text-card-foreground shadow-xs">
      <CardHeader className="space-y-1.5 text-center pb-2">
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          Tạo tài khoản
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Chọn loại tài khoản và điền thông tin để bắt đầu.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4 pt-2">
          {/* Role selector segmented control */}
          <div className="space-y-1.5">
            <span
              id="role-selector-label"
              className="block text-xs font-semibold text-foreground"
            >
              Bạn muốn dùng TicketHub để:
            </span>
            <div
              role="radiogroup"
              aria-labelledby="role-selector-label"
              className="grid grid-cols-2 gap-1 p-1 rounded-lg border border-border bg-muted/60"
            >
              <button
                type="button"
                role="radio"
                aria-checked={role === UserRole.BUYER}
                onClick={() => handleRoleChange(UserRole.BUYER)}
                className={`h-9 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center gap-1.5 ${
                  role === UserRole.BUYER
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="size-3.5" />
                <span>Người mua vé</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={role === UserRole.ORGANIZER}
                onClick={() => handleRoleChange(UserRole.ORGANIZER)}
                className={`h-9 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center gap-1.5 ${
                  role === UserRole.ORGANIZER
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Building2 className="size-3.5" />
                <span>Ban tổ chức</span>
              </button>
            </div>
          </div>

          {/* Server error alert */}
          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive"
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Full name field */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs font-semibold text-foreground">
              Họ và tên <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="Ví dụ: Nguyễn Văn An"
                className="h-11 pl-9 rounded-lg text-sm bg-background border-input text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
                {...register("fullName")}
              />
            </div>
            {errors.fullName && (
              <p
                id="fullName-error"
                role="alert"
                className="flex items-center gap-1.5 text-xs text-destructive font-medium"
              >
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{errors.fullName.message}</span>
              </p>
            )}
          </div>

          {/* Organizer-only organization name (optional on backend) */}
          {role === UserRole.ORGANIZER && (
            <div className="space-y-1.5">
              <Label
                htmlFor="organizationName"
                className="text-xs font-semibold text-foreground"
              >
                Tên Tổ chức / Doanh nghiệp <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Building2 className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="organizationName"
                  type="text"
                  placeholder="Ví dụ: Công ty Giải trí & Sự kiện ABC"
                  className="h-11 pl-9 rounded-lg text-sm bg-background border-input text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-invalid={!!errors.organizationName}
                  aria-describedby={
                    errors.organizationName ? "organizationName-error" : undefined
                  }
                  {...register("organizationName")}
                />
              </div>
              {errors.organizationName && (
                <p
                  id="organizationName-error"
                  role="alert"
                  className="flex items-center gap-1.5 text-xs text-destructive font-medium"
                >
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{errors.organizationName.message}</span>
                </p>
              )}
            </div>
          )}

          {/* Email field */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-foreground">
              Địa chỉ Email <span className="text-destructive">*</span>
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

          {/* Phone number field (font-sans, not monospace) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="phone" className="text-xs font-semibold text-foreground">
                Số điện thoại
              </Label>
              <span className="text-xs text-muted-foreground font-normal">
                (Không bắt buộc)
              </span>
            </div>
            <div className="relative">
              <Phone className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="Ví dụ: 0912345678"
                className="h-11 pl-9 rounded-lg text-sm bg-background border-input text-foreground font-sans placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                {...register("phone")}
              />
            </div>
            {errors.phone && (
              <p
                id="phone-error"
                role="alert"
                className="flex items-center gap-1.5 text-xs text-destructive font-medium"
              >
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{errors.phone.message}</span>
              </p>
            )}
          </div>

          {/* Passwords stacked in a single column */}
          <div className="space-y-4">
            {/* Password field */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                Mật khẩu <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Lock className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Nhập mật khẩu"
                  className="h-11 pl-9 pr-10 rounded-lg text-sm bg-background border-input text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : "password-hint"
                  }
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

              {/* Persistent helper text & strength check */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
                <span id="password-hint">Tối thiểu 8 ký tự.</span>
                {watchedPassword && watchedPassword.length >= 8 && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                    <Check className="size-3 text-emerald-600" />
                    <span>Đạt độ dài yêu cầu</span>
                  </span>
                )}
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

            {/* Confirm Password field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className="text-xs font-semibold text-foreground"
              >
                Xác nhận mật khẩu <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Lock className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Nhập lại mật khẩu"
                  className="h-11 pl-9 pr-10 rounded-lg text-sm bg-background border-input text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={
                    errors.confirmPassword ? "confirmPassword-error" : undefined
                  }
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs p-1"
                  aria-label={
                    showConfirmPassword
                      ? "Ẩn mật khẩu xác nhận"
                      : "Hiện mật khẩu xác nhận"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p
                  id="confirmPassword-error"
                  role="alert"
                  className="flex items-center gap-1.5 text-xs text-destructive font-medium"
                >
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{errors.confirmPassword.message}</span>
                </p>
              )}
            </div>
          </div>

          {/* Required Consent Checkbox */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              id="consent"
              type="checkbox"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="mt-0.5 size-4 rounded-xs border-border text-primary focus-visible:ring-2 focus-visible:ring-ring cursor-pointer accent-primary shrink-0"
              aria-required="true"
            />
            <label
              htmlFor="consent"
              className="text-xs text-foreground leading-relaxed cursor-pointer select-none"
            >
              Tôi đồng ý với{" "}
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline"
              >
                Điều khoản sử dụng
              </Link>{" "}
              và{" "}
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline"
              >
                Chính sách bảo mật
              </Link>
              .
            </label>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3.5 bg-transparent border-t-0 pt-2 pb-6">
          <Button
            type="submit"
            disabled={!isAgreed || isSubmitting}
            className="w-full h-11 rounded-lg font-semibold text-sm shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-40 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span>Đang tạo tài khoản...</span>
              </span>
            ) : (
              "Đăng ký ngay"
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link
              href="/login"
              className="text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
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
        <div className="text-center text-sm text-muted-foreground py-8">
          Đang tải...
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}
