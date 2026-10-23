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
    <div data-slot="auth-form" className="w-full flex flex-col gap-7">
      <header className="flex flex-col gap-2 text-left">
        <h1 className="text-[28px] leading-8 font-semibold tracking-tight text-foreground">
          Tạo tài khoản
        </h1>
        <p className="text-base text-muted-foreground leading-normal">
          Chọn loại tài khoản và điền thông tin để bắt đầu.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col">
        {/* Role selector segmented control (Neutral track, white chip when selected, NO solid green fill) */}
        <div className="flex flex-col gap-2 mb-6">
          <span
            id="role-selector-label"
            className="block text-sm font-medium text-foreground"
          >
            Bạn muốn dùng TicketHub để:
          </span>
          <div
            role="radiogroup"
            aria-labelledby="role-selector-label"
            className="h-12 grid grid-cols-2 gap-1 p-1 rounded-lg border border-border bg-muted/60"
          >
            <button
              type="button"
              role="radio"
              aria-checked={role === UserRole.BUYER}
              tabIndex={role === UserRole.BUYER ? 0 : -1}
              onClick={() => handleRoleChange(UserRole.BUYER)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                  e.preventDefault();
                  handleRoleChange(UserRole.ORGANIZER);
                }
              }}
              className={`h-10 rounded-md text-sm transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 flex items-center justify-center gap-1.5 ${
                role === UserRole.BUYER
                  ? "bg-background text-foreground font-semibold shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground font-medium"
              }`}
            >
              <User className="size-4" />
              <span>Người mua vé</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={role === UserRole.ORGANIZER}
              tabIndex={role === UserRole.ORGANIZER ? 0 : -1}
              onClick={() => handleRoleChange(UserRole.ORGANIZER)}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                  e.preventDefault();
                  handleRoleChange(UserRole.BUYER);
                }
              }}
              className={`h-10 rounded-md text-sm transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 flex items-center justify-center gap-1.5 ${
                role === UserRole.ORGANIZER
                  ? "bg-background text-foreground font-semibold shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground font-medium"
              }`}
            >
              <Building2 className="size-4" />
              <span>Ban tổ chức</span>
            </button>
          </div>
        </div>

        {/* Server error alert */}
        {serverError && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Fields and Checkbox Container (20px gap between items) */}
        <div className="flex flex-col gap-5">
          {/* Full name field */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
              Họ và tên
            </Label>
            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <User className="size-5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  aria-required="true"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className={`h-12 pl-11 pr-3.5 rounded-lg text-base bg-background text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors ${
                    errors.fullName
                      ? "border-destructive focus-visible:border-destructive"
                      : "border border-muted-foreground hover:border-foreground"
                  }`}
                  aria-invalid={!!errors.fullName}
                  aria-describedby={errors.fullName ? "fullName-error" : undefined}
                  {...register("fullName")}
                />
              </div>
              {errors.fullName && (
                <p
                  id="fullName-error"
                  role="alert"
                  className="flex items-center gap-1.5 text-[13px] text-destructive font-medium"
                >
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{errors.fullName.message}</span>
                </p>
              )}
            </div>
          </div>

          {/* Organizer-only organization name */}
          {role === UserRole.ORGANIZER && (
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="organizationName"
                className="text-sm font-medium text-foreground"
              >
                Tên Tổ chức / Doanh nghiệp
              </Label>
              <div className="flex flex-col gap-1.5">
                <div className="relative">
                  <Building2 className="size-5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    id="organizationName"
                    type="text"
                    required
                    aria-required="true"
                    placeholder="Ví dụ: Công ty Giải trí & Sự kiện ABC"
                    className={`h-12 pl-11 pr-3.5 rounded-lg text-base bg-background text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors ${
                      errors.organizationName
                        ? "border-destructive focus-visible:border-destructive"
                        : "border border-muted-foreground hover:border-foreground"
                    }`}
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
                    className="flex items-center gap-1.5 text-[13px] text-destructive font-medium"
                  >
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{errors.organizationName.message}</span>
                  </p>
                )}
              </div>
            </div>
          )}

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

          {/* Phone number field (font-sans, optional label "Tùy chọn", NO asterisk) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between w-full">
              <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                Số điện thoại
              </Label>
              <span className="text-[13px] text-muted-foreground font-normal">
                Tùy chọn
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <Phone className="size-5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="Ví dụ: 0912345678"
                  className={`h-12 pl-11 pr-3.5 rounded-lg text-base bg-background text-foreground font-sans placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors ${
                    errors.phone
                      ? "border-destructive focus-visible:border-destructive"
                      : "border border-muted-foreground hover:border-foreground"
                  }`}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                  {...register("phone")}
                />
              </div>
              {errors.phone && (
                <p
                  id="phone-error"
                  role="alert"
                  className="flex items-center gap-1.5 text-[13px] text-destructive font-medium"
                >
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{errors.phone.message}</span>
                </p>
              )}
            </div>
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Mật khẩu
            </Label>
            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <Lock className="size-5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  aria-required="true"
                  placeholder="Nhập mật khẩu"
                  className={`h-12 pl-11 pr-11 rounded-lg text-base bg-background text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors ${
                    errors.password
                      ? "border-destructive focus-visible:border-destructive"
                      : "border border-muted-foreground hover:border-foreground"
                  }`}
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
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>

              {/* Helper text clearly belonging to password input (6px gap) */}
              <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                <span id="password-hint">Tối thiểu 8 ký tự</span>
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
                  className="flex items-center gap-1.5 text-[13px] text-destructive font-medium"
                >
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>
          </div>

          {/* Required Consent Checkbox (44px target, checkbox box >= 20px) */}
          <div id="consent-row" className="h-11 flex items-center gap-3 select-none">
            <input
              id="consent"
              type="checkbox"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="size-5 rounded-xs border-muted-foreground text-primary focus-visible:ring-2 focus-visible:ring-ring cursor-pointer accent-primary shrink-0"
              aria-required="true"
            />
            <label
              htmlFor="consent"
              className="text-xs sm:text-sm text-foreground leading-relaxed cursor-pointer py-1 flex-1"
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
        </div>

        {/* Submit & Switch Links (24px gap after checkbox row) */}
        <div className="flex flex-col gap-6 pt-6">
          <div className="flex flex-col gap-2.5">
            <Button
              type="submit"
              aria-disabled={!isAgreed || isSubmitting}
              className={`w-full h-12 rounded-lg font-semibold text-base shadow-xs transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                !isAgreed
                  ? "bg-primary text-primary-foreground opacity-50 cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              }`}
              aria-describedby={!isAgreed ? "consent-submit-hint" : undefined}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-5 animate-spin" />
                  <span>Đang tạo tài khoản...</span>
                </span>
              ) : (
                "Đăng ký ngay"
              )}
            </Button>
            {!isAgreed && (
              <p
                id="consent-submit-hint"
                className="text-xs text-muted-foreground text-center"
              >
                Vui lòng đồng ý với điều khoản sử dụng để đăng ký
              </p>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link
              href="/login"
              className="text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </form>
    </div>
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
