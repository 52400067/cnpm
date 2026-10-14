"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { forgotPasswordSchema, ForgotPasswordInput } from "@/validations/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    console.log("Gửi yêu cầu reset pass:", data.email);
  };

  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader className="text-center space-y-1">
        <CardTitle className="text-2xl font-bold">Khôi phục mật khẩu</CardTitle>
        <CardDescription>Nhập email đăng ký để nhận liên kết đặt lại mật khẩu</CardDescription>
      </CardHeader>
      {isSubmitSuccessful ? (
        <CardContent className="space-y-4 text-center">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-md text-sm">
            Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu về email của bạn. Vui lòng kiểm tra hộp thư!
          </div>
          <Link href="/login">
            <Button variant="outline" className="w-full mt-2">Quay lại đăng nhập</Button>
          </Link>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="ten@vidu.com" {...register("email")} />
              {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Đang gửi..." : "Gửi liên kết khôi phục"}
            </Button>
            <Link href="/login" className="text-xs text-center text-muted-foreground hover:underline">
              Quay lại đăng nhập
            </Link>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}