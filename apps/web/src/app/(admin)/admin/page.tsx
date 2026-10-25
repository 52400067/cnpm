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

export default function AdminModerationPage() {
  const queryClient = useQueryClient();

  // State cho Modal nhập lý do từ chối
  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    type: "ORGANIZER" | "EVENT";
    targetId: string;
    targetName: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // State xem chi tiết sự kiện (BE1)
  const [selectedEvent, setSelectedEvent] = useState<OrganizerEventItem | null>(null);

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
    },
  });

  const eventMutation = useMutation({
    mutationFn: reviewAdminEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPendingEvents"] });
      queryClient.invalidateQueries({ queryKey: ["adminAuditLogs"] });
      setRejectModal(null);
      setRejectReason("");
    },
  });

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối để hệ thống gửi email thông báo cho BTC.");
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
    (o) => o.status === "PENDING_VERIFICATION"
  ).length;
  const pendingEventsCount = events.filter(
    (e) => e.status === "PENDING_APPROVAL"
  ).length;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Trung tâm Kiểm duyệt Admin (UC10)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Xác minh hồ sơ pháp lý Ban tổ chức và kiểm duyệt nội dung sự kiện trước khi mở bán công khai.
        </p>
      </div>

      {/* Thẻ thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hồ sơ BTC chờ xác minh</CardDescription>
            <CardTitle className="text-2xl text-amber-600">{pendingOrgsCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sự kiện chờ phê duyệt</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{pendingEventsCount}</CardTitle>
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
          <TabsTrigger value="audit">Nhật ký kiểm duyệt ({auditLogs.length})</TabsTrigger>
        </TabsList>

        {/* TAB 1: DUYỆT HỒ SƠ BTC */}
        <TabsContent value="organizers">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách Hồ sơ Ban tổ chức</CardTitle>
              <CardDescription>
                Kiểm tra Mã số thuế/CCCD và giấy phép kinh doanh trước khi cấp quyền VERIFIED.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOrgs ? (
                <div className="py-8 text-center text-muted-foreground">Đang tải danh sách...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên đơn vị & Đại diện</TableHead>
                      <TableHead>MST / CCCD</TableHead>
                      <TableHead>Liên hệ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác kiểm duyệt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizers.map((org: OrganizerProfile) => (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div className="font-medium">{org.organizationName}</div>
                          <div className="text-xs text-muted-foreground">
                            ĐD: {org.representativeName}
                          </div>
                          {org.rejectionReason && (
                            <div className="text-xs text-red-600 mt-1">
                              Lý do từ chối: {org.rejectionReason}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{org.taxCode}</TableCell>
                        <TableCell className="text-xs">
                          <div>{org.phone}</div>
                          <div className="text-muted-foreground">{org.email}</div>
                        </TableCell>
                        <TableCell>
                          {org.status === "VERIFIED" && (
                            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200">
                              Đã duyệt
                            </Badge>
                          )}
                          {org.status === "PENDING_VERIFICATION" && (
                            <Badge className="bg-amber-50 text-amber-800 border-amber-200">
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
                            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                            disabled={
                              org.status === "VERIFIED" || orgMutation.isPending
                            }
                            onClick={() =>
                              orgMutation.mutate({ id: org.id, decision: "APPROVE" })
                            }
                          >
                            Phê duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-600 hover:bg-red-50"
                            disabled={orgMutation.isPending}
                            onClick={() =>
                              setRejectModal({
                                open: true,
                                type: "ORGANIZER",
                                targetId: org.id,
                                targetName: org.organizationName,
                              })
                            }
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

        {/* TAB 2: DUYỆT SỰ KIỆN */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách Sự kiện chờ kiểm duyệt</CardTitle>
              <CardDescription>
                Sự kiện sau khi được phê duyệt sẽ chuyển từ PENDING_APPROVAL sang PUBLISHED.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEvents ? (
                <div className="py-8 text-center text-muted-foreground">Đang tải sự kiện...</div>
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
                              <div className="text-xs text-red-600 mt-1">
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
                            <Badge variant="outline" className={statusMeta.badgeClass}>
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
                              className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                              disabled={eventMutation.isPending}
                              onClick={() =>
                                eventMutation.mutate({ id: evt.id, decision: "APPROVE" })
                              }
                            >
                              Duyệt mở bán
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-600 hover:bg-red-50"
                              disabled={eventMutation.isPending}
                              onClick={() =>
                                setRejectModal({
                                  open: true,
                                  type: "EVENT",
                                  targetId: evt.id,
                                  targetName: evt.title,
                                })
                              }
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
                Ghi nhận bất biến mọi quyết định phê duyệt hoặc từ chối của Admin.
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
                        {log.actorEmail}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {log.targetName}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.reason || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL NHẬP LÝ DO TỪ CHỐI (Bắt buộc theo yêu cầu W02-FE1) */}
      {rejectModal?.open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-red-600">
                Xác nhận từ chối {rejectModal.type === "ORGANIZER" ? "Hồ sơ BTC" : "Sự kiện"}
              </CardTitle>
              <CardDescription>
                Đối tượng: <strong>{rejectModal.targetName}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleConfirmReject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rejectReason">
                    Lý do từ chối (bắt buộc để gửi email cho BTC) *
                  </Label>
                  <Input
                    id="rejectReason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="VD: Giấy phép kinh doanh bị mờ / Thông tin vé chưa hợp lệ..."
                    autoFocus
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setRejectModal(null);
                      setRejectReason("");
                    }}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" variant="destructive">
                    Xác nhận Từ chối
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT SỰ KIỆN TỪ BE1 */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-xl">
            <CardHeader>
              <CardTitle>{selectedEvent.title}</CardTitle>
              <CardDescription>Mã sự kiện: {selectedEvent.id} · Phiên bản: v{selectedEvent.version}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><strong>Thể loại:</strong> {selectedEvent.category}</div>
              <div><strong>Địa điểm:</strong> {selectedEvent.venueName} ({selectedEvent.venueAddress}, {selectedEvent.city})</div>
              <div><strong>Thời gian bắt đầu:</strong> {formatDateTimeVi(selectedEvent.startTime)}</div>
              <div><strong>Tổng số lượng vé phát hành:</strong> {formatNumberVi(selectedEvent.ticketsTotal)} vé</div>
              <div className="pt-4 flex justify-end">
                <Button onClick={() => setSelectedEvent(null)}>Đóng</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 