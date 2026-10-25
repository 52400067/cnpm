"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminOrganizers,
  reviewOrganizerProfile,
  getAdminPendingEvents,
  reviewAdminEvent,
  getAdminAuditLogs,
  formatDateTimeVi,
  formatNumberVi,
  getDisplayStatus,
  type OrganizerProfile,
  type OrganizerEventItem,
} from "@/lib/organizer-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Ham an thong tin ca nhan (Decree 13/2023/ND-CP)
function maskIdentifier(val?: string): string {
  if (!val) return "";
  if (val.length <= 4) return val;
  return "*".repeat(val.length - 4) + val.slice(-4);
}

function maskPhone(phone?: string): string {
  if (!phone) return "";
  if (phone.length <= 4) return phone;
  return phone.slice(0, 3) + "****" + phone.slice(-3);
}

function maskEmail(email?: string): string {
  if (!email || !email.includes("@")) return email || "";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `*@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

export default function AdminModerationPage() {
  const queryClient = useQueryClient();

  // State cho Modal nhap ly do tu choi
  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    type: "ORGANIZER" | "EVENT";
    targetId: string;
    targetName: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  // State xem chi tiet su kien (BE1)
  const [selectedEvent, setSelectedEvent] = useState<OrganizerEventItem | null>(
    null,
  );

  // Queries
  const { data: organizers = [], isLoading: loadingOrgs } = useQuery({
    queryKey: ["adminOrganizers"],
    queryFn: getAdminOrganizers,
  });

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ["adminPendingEvents"],
    queryFn: getAdminPendingEvents,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["adminAuditLogs"],
    queryFn: getAdminAuditLogs,
  });

  // Mutations
  const orgMutation = useMutation({
    mutationFn: reviewOrganizerProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrganizers"] });
      queryClient.invalidateQueries({ queryKey: ["myOrganizerProfile"] });
      queryClient.invalidateQueries({ queryKey: ["adminAuditLogs"] });
      setRejectModal(null);
      setRejectReason("");
      setRejectError(null);
    },
    onError: (err: Error) => {
      setRejectError(err.message || "Thao tác thất bại. Vui lòng thử lại.");
    },
  });

  const eventMutation = useMutation({
    mutationFn: reviewAdminEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPendingEvents"] });
      queryClient.invalidateQueries({ queryKey: ["adminAuditLogs"] });
      setRejectModal(null);
      setRejectReason("");
      setRejectError(null);
    },
    onError: (err: Error) => {
      setRejectError(err.message || "Thao tác thất bại. Vui lòng thử lại.");
    },
  });

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      setRejectError(
        "Vui lòng nhập lý do từ chối để hệ thống gửi thông báo cho BTC.",
      );
      return;
    }

    if (rejectModal.type === "ORGANIZER") {
      orgMutation.mutate({
        id: rejectModal.targetId,
        decision: "REJECT",
        reason: rejectReason.trim(),
      });
    } else {
      eventMutation.mutate({
        id: rejectModal.targetId,
        decision: "REJECT",
        reason: rejectReason.trim(),
      });
    }
  };

  const pendingOrgsCount = organizers.filter(
    (o) => o.status === "PENDING_VERIFICATION",
  ).length;
  const pendingEventsCount = events.filter(
    (e) => e.status === "PENDING_APPROVAL",
  ).length;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Trung tâm Kiểm duyệt Admin (UC10)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Xác minh hồ sơ pháp lý Ban tổ chức và kiểm duyệt nội dung sự kiện
          trước khi mở bán công khai.
        </p>
      </div>

      {/* The thong ke nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hồ sơ BTC chờ xác minh</CardDescription>
            <CardTitle className="text-2xl text-amber-700 dark:text-amber-400">
              {pendingOrgsCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sự kiện chờ phê duyệt</CardDescription>
            <CardTitle className="text-2xl text-primary">
              {pendingEventsCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Thao tác đã ghi Audit Log</CardDescription>
            <CardTitle className="text-2xl">{auditLogs.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="organizers" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="organizers">
            Hồ sơ BTC ({pendingOrgsCount} chờ duyệt)
          </TabsTrigger>
          <TabsTrigger value="events">
            Sự kiện chờ duyệt ({pendingEventsCount})
          </TabsTrigger>
          <TabsTrigger value="audit">
            Nhật ký kiểm duyệt ({auditLogs.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: DUYET HO SO BTC */}
        <TabsContent value="organizers">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách Hồ sơ Ban tổ chức</CardTitle>
              <CardDescription>
                Kiểm tra Mã số thuế/CCCD và giấy phép kinh doanh trước khi cấp
                quyền VERIFIED.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOrgs ? (
                <div className="py-8 text-center text-muted-foreground">
                  Đang tải danh sách...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên đơn vị & Đại diện</TableHead>
                      <TableHead>MST / CCCD</TableHead>
                      <TableHead>Liên hệ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">
                        Thao tác kiểm duyệt
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizers.map((org: OrganizerProfile) => (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div className="font-medium">
                            {org.organizationName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ĐD: {org.representativeName}
                          </div>
                          {org.rejectionReason && (
                            <div className="text-xs text-destructive mt-1">
                              Lý do từ chối: {org.rejectionReason}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {maskIdentifier(org.taxCode)}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>{maskPhone(org.phone)}</div>
                          <div className="text-muted-foreground">
                            {maskEmail(org.email)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {org.status === "VERIFIED" && (
                            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                              Đã duyệt
                            </Badge>
                          )}
                          {org.status === "PENDING_VERIFICATION" && (
                            <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                              Chờ xác minh
                            </Badge>
                          )}
                          {org.status === "REJECTED" && (
                            <Badge variant="destructive">Đã từ chối</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                            disabled={
                              org.status === "VERIFIED" || orgMutation.isPending
                            }
                            onClick={() =>
                              orgMutation.mutate({
                                id: org.id,
                                decision: "APPROVE",
                              })
                            }
                          >
                            Phê duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive/40 text-destructive hover:bg-destructive/10"
                            disabled={orgMutation.isPending}
                            onClick={() => {
                              setRejectError(null);
                              setRejectModal({
                                open: true,
                                type: "ORGANIZER",
                                targetId: org.id,
                                targetName: org.organizationName,
                              });
                            }}
                          >
                            Từ chối
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: DUYET SU KIEN */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách Sự kiện chờ kiểm duyệt</CardTitle>
              <CardDescription>
                Sự kiện sau khi được phê duyệt sẽ chuyển từ PENDING_APPROVAL
                sang PUBLISHED.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEvents ? (
                <div className="py-8 text-center text-muted-foreground">
                  Đang tải sự kiện...
                </div>
              ) : events.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Hiện không có sự kiện nào đang chờ duyệt.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sự kiện</TableHead>
                      <TableHead>Địa điểm & Thời gian</TableHead>
                      <TableHead>Tổng số vé</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((evt: OrganizerEventItem) => {
                      const statusMeta = getDisplayStatus(evt);
                      return (
                        <TableRow key={evt.id}>
                          <TableCell>
                            <div className="font-medium">{evt.title}</div>
                            <div className="text-xs text-muted-foreground">
                              Thể loại: {evt.category}
                            </div>
                            {evt.rejectionReason && (
                              <div className="text-xs text-destructive mt-1">
                                Lý do từ chối: {evt.rejectionReason}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="font-medium">{evt.venueName}</div>
                            <div className="text-muted-foreground">
                              {formatDateTimeVi(evt.startTime)} · {evt.city}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatNumberVi(evt.ticketsTotal)} vé
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={statusMeta.badgeClass}
                            >
                              {statusMeta.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedEvent(evt)}
                            >
                              Chi tiết
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                              disabled={eventMutation.isPending}
                              onClick={() =>
                                eventMutation.mutate({
                                  id: evt.id,
                                  decision: "APPROVE",
                                })
                              }
                            >
                              Duyệt mở bán
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive/40 text-destructive hover:bg-destructive/10"
                              disabled={eventMutation.isPending}
                              onClick={() => {
                                setRejectError(null);
                                setRejectModal({
                                  open: true,
                                  type: "EVENT",
                                  targetId: evt.id,
                                  targetName: evt.title,
                                });
                              }}
                            >
                              Từ chối
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: AUDIT LOG */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Nhật ký thao tác kiểm duyệt (Audit Log)</CardTitle>
              <CardDescription>
                Ghi nhận bất biến mọi quyết định phê duyệt hoặc từ chối của
                Admin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Người thực hiện</TableHead>
                    <TableHead>Hành động</TableHead>
                    <TableHead>Đối tượng</TableHead>
                    <TableHead>Ghi chú / Lý do</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">
                        {formatDateTimeVi(log.timestamp)}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {maskEmail(log.actorEmail)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {log.targetName}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.reason || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL RADIX NHAP LY DO TU CHOI (Co focus trap va Escape dismiss) */}
      <Dialog
        open={Boolean(rejectModal?.open)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectModal(null);
            setRejectReason("");
            setRejectError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Xác nhận từ chối{" "}
              {rejectModal?.type === "ORGANIZER" ? "Hồ sơ BTC" : "Sự kiện"}
            </DialogTitle>
            <DialogDescription>
              Đối tượng: <strong>{rejectModal?.targetName}</strong>
            </DialogDescription>
          </DialogHeader>

          {rejectError && (
            <div
              role="alert"
              className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm"
            >
              {rejectError}
            </div>
          )}

          <form onSubmit={handleConfirmReject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">
                Lý do từ chối (bắt buộc để gửi thông báo cho BTC) *
              </Label>
              <Input
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="VD: Giấy phép kinh doanh bị mờ / Thông tin chưa hợp lệ..."
                autoFocus
                required
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setRejectModal(null);
                  setRejectReason("");
                  setRejectError(null);
                }}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={orgMutation.isPending || eventMutation.isPending}
              >
                {orgMutation.isPending || eventMutation.isPending
                  ? "Đang xử lý..."
                  : "Xác nhận Từ chối"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL RADIX XEM CHI TIET SU KIEN */}
      <Dialog
        open={Boolean(selectedEvent)}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              Mã sự kiện: {selectedEvent?.id} · Phiên bản: v
              {selectedEvent?.version}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-3 text-sm">
              <div>
                <strong>Thể loại:</strong> {selectedEvent.category}
              </div>
              <div>
                <strong>Địa điểm:</strong> {selectedEvent.venueName} (
                {selectedEvent.venueAddress}, {selectedEvent.city})
              </div>
              <div>
                <strong>Thời gian bắt đầu:</strong>{" "}
                {formatDateTimeVi(selectedEvent.startTime)}
              </div>
              <div>
                <strong>Tổng số lượng vé phát hành:</strong>{" "}
                {formatNumberVi(selectedEvent.ticketsTotal)} vé
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setSelectedEvent(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
