"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { verifyEmailSchema, VerifyEmailInput } from "@/validations/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "người dùng";

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
  });

  const onSubmit = async (data: VerifyEmailInput) => {
    console.log("Xác minh OTP:", data.otp);
    alert("Xác thực email thành công! Đang chuyển về trang đăng nhập.");
    router.push("/login");
  };

  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader className="text-center space-y-1">
        <CardTitle className="text-2xl font-bold">Xác thực tài khoản</CardTitle>
        <CardDescription>
          Mã OTP 6 số đã được gửi tới: <strong className="text-slate-800">{email}</strong>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Nhập mã OTP</Label>
            <Input
              id="otp"
              maxLength={6}
              placeholder="123456"
              className="text-center tracking-widest text-lg font-mono"
              {...register("otp")}
            />
            {errors.otp && <p className="text-xs text-red-500 font-medium text-center">{errors.otp.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Đang xác thực..." : "Xác nhận mã OTP"}
          </Button>
          <div className="text-xs text-center text-muted-foreground">
            Chưa nhận được mã?{" "}
            <button type="button" className="text-primary font-medium hover:underline">
              Gửi lại
            </button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center">Đang tải...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}