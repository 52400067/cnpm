// apps/web/src/app/(auth)/verify-email/page.tsx
"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MailCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { verifyEmailSchema, VerifyEmailInput } from "@/validations/auth";
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

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "email của bạn";
  const initialToken = searchParams.get("token") || "";

  const [verified, setVerified] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      token: initialToken,
    },
  });

  const onSubmit = async (data: VerifyEmailInput) => {
    setServerError(null);
    try {
      await authApi.verifyEmail({ token: data.token });
      setVerified(true);
      setTimeout(() => router.push("/login"), 1800);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setVerified(true);
        setTimeout(() => router.push("/login"), 1500);
      }
    }
  };

  return (
    <Card className="shadow-xl border-slate-200/80 rounded-2xl bg-white">
      <CardHeader className="text-center space-y-2 pb-2">
        <div className="mx-auto size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <MailCheck className="size-6" />
        </div>
        <CardTitle className="text-2xl font-bold text-slate-900">
          Xác thực địa chỉ Email
        </CardTitle>
        <CardDescription className="text-slate-500">
          Chúng tôi đã gửi mã/liên kết kích hoạt (hiệu lực 24 giờ) tới:{" "}
          <strong className="text-slate-800">{email}</strong>
        </CardDescription>
      </CardHeader>

      {verified ? (
        <CardContent className="py-6 text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="size-5 shrink-0" />
            <span>
              Tài khoản đã kích hoạt thành công! Đang chuyển về trang đăng
              nhập...
            </span>
          </div>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4 pt-2">
            {serverError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="token">Mã kích hoạt / Token xác thực</Label>
              <Input
                id="token"
                placeholder="Nhập mã xác thực từ email..."
                className="h-10 text-center font-mono rounded-xl"
                aria-invalid={!!errors.token}
                {...register("token")}
              />
              {errors.token && (
                <p className="text-xs text-red-600 font-medium text-center">
                  {errors.token.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 bg-transparent border-t-0 pt-2 pb-6">
            <Button
              type="submit"
              size="lg"
              className="w-full h-11 rounded-full font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang kiểm tra..." : "Xác nhận kích hoạt"}
            </Button>
            <div className="text-xs text-center text-slate-500">
              Quay lại{" "}
              <Link
                href="/login"
                className="text-primary font-semibold hover:underline"
              >
                Trang đăng nhập
              </Link>
            </div>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center text-sm text-slate-500">Đang tải...</div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
