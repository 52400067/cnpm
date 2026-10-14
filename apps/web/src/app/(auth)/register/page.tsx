"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerSchema, RegisterInput } from "@/validations/auth";
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

export default function RegisterPage() {
  const [role, setRole] = useState<"BUYER" | "ORGANIZER">("BUYER");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "BUYER",
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      organizationName: "",
    },
  });

  const handleRoleChange = (val: string) => {
    const selected = val as "BUYER" | "ORGANIZER";
    setRole(selected);
    setValue("role", selected);
  };

  const onSubmit = async (data: RegisterInput) => {
    console.log("Dữ liệu đăng ký:", data);
    // Chuyển hướng sang màn hình xác thực OTP email
    router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
  };

  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Tạo tài khoản</CardTitle>
        <CardDescription>
          Chọn loại tài khoản phù hợp với nhu cầu của bạn
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <Tabs
            defaultValue="BUYER"
            value={role}
            onValueChange={handleRoleChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="BUYER">Người Mua Vé</TabsTrigger>
              <TabsTrigger value="ORGANIZER">Ban Tổ Chức</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input id="fullName" placeholder="Nguyễn Văn A" {...register("fullName")} />
            {errors.fullName && (
              <p className="text-xs text-red-500 font-medium">{errors.fullName.message}</p>
            )}
          </div>

          {role === "ORGANIZER" && (
            <div className="space-y-2">
              <Label htmlFor="organizationName">Tên tổ chức / Doanh nghiệp</Label>
              <Input
                id="organizationName"
                placeholder="Công ty Sự kiện XYZ"
                {...register("organizationName")}
              />
              {errors.organizationName && (
                <p className="text-xs text-red-500 font-medium">
                  {errors.organizationName.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="ten@vidu.com" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
            {errors.password && (
              <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 font-medium">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Đang tạo..." : "Đăng ký ngay"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Đăng nhập
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}