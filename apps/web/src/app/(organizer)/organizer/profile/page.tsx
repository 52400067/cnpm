"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyOrganizerProfile,
  updateMyOrganizerProfile,
  formatDateTimeVi,
  type OrganizerVerificationStatus,
} from "@/lib/organizer-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OrganizerProfilePage() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["myOrganizerProfile"],
    queryFn: getMyOrganizerProfile,
  });

  const [formData, setFormData] = useState({
    organizationName: "",
    taxCode: "",
    representativeName: "",
    phone: "",
    email: "",
    address: "",
    businessLicenseUrl: "",
  });

  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        organizationName: profile.organizationName || "",
        taxCode: profile.taxCode || "",
        representativeName: profile.representativeName || "",
        phone: profile.phone || "",
        email: profile.email || "",
        address: profile.address || "",
        businessLicenseUrl: profile.businessLicenseUrl || "",
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: updateMyOrganizerProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(["myOrganizerProfile"], updated);
      setSavedMessage("Đã lưu hồ sơ và gửi yêu cầu xét duyệt thành công!");
      setTimeout(() => setSavedMessage(null), 4000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.organizationName.trim() || !formData.taxCode.trim()) {
      alert("Vui lòng nhập đầy đủ Tên đơn vị tổ chức và Mã số thuế / CCCD.");
      return;
    }
    updateMutation.mutate(formData);
  };

  const renderStatusBadge = (status?: OrganizerVerificationStatus) => {
    switch (status) {
      case "VERIFIED":
        return (
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-50">
            ✓ Đã xác minh (VERIFIED)
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive">
            ✕ Bị từ chối (REJECTED)
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-50">
            ⏳ Đang chờ duyệt (PENDING_VERIFICATION)
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="h-8 w-64 bg-slate-200 animate-pulse rounded" />
        <div className="h-96 bg-slate-100 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hồ sơ Ban tổ chức</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cung cấp thông tin pháp lý để Admin phê duyệt quyền mở bán sự kiện trên TicketHub.
          </p>
        </div>
        <div>{renderStatusBadge(profile?.status)}</div>
      </div>

      {/* Thông báo khi bị Admin từ chối */}
      {profile?.status === "REJECTED" && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm space-y-1">
          <div className="font-semibold">Hồ sơ của bạn bị từ chối phê duyệt</div>
          <div>
            <strong>Lý do từ Admin:</strong>{" "}
            {profile.rejectionReason || "Thông tin giấy phép kinh doanh hoặc mã số thuế chưa hợp lệ."}
          </div>
          <div className="text-xs text-red-600 pt-1">
            Vui lòng cập nhật lại thông tin chính xác bên dưới và bấm &quot;Gửi duyệt lại&quot;.
          </div>
        </div>
      )}

      {/* Thông báo khi đã duyệt */}
      {profile?.status === "VERIFIED" && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          Hồ sơ Ban tổ chức đã được xác minh hợp lệ. Bạn có toàn quyền tạo và gửi xuất bản sự kiện mới.
        </div>
      )}

      {savedMessage && (
        <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium">
          {savedMessage}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Thông tin pháp lý & Liên hệ</CardTitle>
          <CardDescription>
            Cập nhật lần cuối: {profile?.updatedAt ? formatDateTimeVi(profile.updatedAt) : "Chưa rõ"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="organizationName">Tên đơn vị / Doanh nghiệp tổ chức *</Label>
                <Input
                  id="organizationName"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  placeholder="VD: Công ty TNHH Giải Trí Sao Việt"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxCode">Mã số thuế / Số CCCD *</Label>
                <Input
                  id="taxCode"
                  value={formData.taxCode}
                  onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                  placeholder="Nhập 10-13 chữ số"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="representativeName">Người đại diện pháp luật *</Label>
                <Input
                  id="representativeName"
                  value={formData.representativeName}
                  onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })}
                  placeholder="Họ và tên người đại diện"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại liên hệ *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0901234567"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email nhận thông báo đối soát *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="organizer@tickethub.com"
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Địa chỉ trụ sở chính</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="businessLicenseUrl">
                  Liên kết Giấy phép kinh doanh / Tài liệu xác minh (PDF/Ảnh)
                </Label>
                <Input
                  id="businessLicenseUrl"
                  value={formData.businessLicenseUrl}
                  onChange={(e) => setFormData({ ...formData, businessLicenseUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending
                  ? "Đang xử lý..."
                  : profile?.status === "REJECTED"
                  ? "Cập nhật & Gửi duyệt lại"
                  : "Lưu hồ sơ & Gửi xác minh"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}