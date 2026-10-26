import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { and, desc, eq } from "drizzle-orm";
import { db } from "../database/db";

import {
  auditLog,
  events,
  organizerProfiles,
  outbox,
  users,
} from "../database/schema";

import {
  EventStatus,
  OrganizerStatus,
  OutboxStatus,
  UserRole,
} from "@tickethub/shared";

export interface ReviewOrganizerDto {
  decision: "APPROVE" | "REJECT";
  reason?: string | undefined;
  version?: number | undefined;
}

export interface ReviewEventDto {
  decision: "APPROVE" | "REJECT";
  reason?: string | undefined;
  version?: number | undefined;
}

export interface AuditRequestMeta {
  ipAddress?: string | null | undefined;
  userAgent?: string | null | undefined;
}

@Injectable()
export class AdminService {
  async getPendingOrganizers() {
    const items = await db
      .select({
        id: organizerProfiles.id,
        userId: organizerProfiles.userId,
        organizationName: organizerProfiles.organizationName,
        representativeName: organizerProfiles.representativeName,
        taxCode: organizerProfiles.taxCode,
        businessLicenseUrl: organizerProfiles.businessLicenseUrl,
        status: organizerProfiles.status,
        version: organizerProfiles.version,
        createdAt: organizerProfiles.createdAt,
        email: users.email,
      })
      .from(organizerProfiles)
      .innerJoin(users, eq(organizerProfiles.userId, users.id))
      .where(eq(organizerProfiles.status, OrganizerStatus.PENDING_VERIFICATION))
      .orderBy(desc(organizerProfiles.createdAt));

    return items;
  }

  async reviewOrganizer(
    profileId: string,
    adminId: string,
    dto: ReviewOrganizerDto,
    meta?: AuditRequestMeta,
  ) {
    const { decision, reason } = dto;

    const newStatus =
      decision === "APPROVE"
        ? OrganizerStatus.VERIFIED
        : OrganizerStatus.REJECTED;

    return db.transaction(async (tx) => {
      // 1. Kiểm tra tồn tại và trạng thái hồ sơ
      const [existing] = await tx
        .select({
          id: organizerProfiles.id,
          userId: organizerProfiles.userId,
          organizationName: organizerProfiles.organizationName,
          status: organizerProfiles.status,
          version: organizerProfiles.version,
        })
        .from(organizerProfiles)
        .where(eq(organizerProfiles.id, profileId))
        .limit(1);

      if (!existing) {
        throw new NotFoundException({
          success: false,
          error: {
            code: "ORGANIZER_NOT_FOUND",
            message: "Không tìm thấy hồ sơ Ban tổ chức",
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (existing.status !== OrganizerStatus.PENDING_VERIFICATION) {
        throw new ConflictException({
          success: false,
          error: {
            code: "ORGANIZER_ALREADY_PROCESSED",
            message: "Hồ sơ Ban tổ chức đã được xử lý trước đó",
            timestamp: new Date().toISOString(),
          },
        });
      }

      const expectedVersion = dto.version ?? existing.version;

      // 2. Cập nhật hồ sơ nếu trạng thái và version hợp lệ
      const [updated] = await tx
        .update(organizerProfiles)
        .set({
          status: newStatus,
          rejectionReason: decision === "REJECT" ? reason : null,
          verifiedBy: decision === "APPROVE" ? adminId : null,
          verifiedAt: decision === "APPROVE" ? new Date() : null,
          version: expectedVersion + 1,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(organizerProfiles.id, profileId),
            eq(organizerProfiles.status, OrganizerStatus.PENDING_VERIFICATION),
            eq(organizerProfiles.version, expectedVersion),
          ),
        )
        .returning();

      if (!updated) {
        throw new ConflictException({
          success: false,
          error: {
            code: "CONCURRENT_MODIFICATION",
            message: "Hồ sơ đã được xử lý hoặc version không còn hợp lệ",
            timestamp: new Date().toISOString(),
          },
        });
      }

      // 3. Lấy tài khoản người dùng của Ban tổ chức
      const [owner] = await tx
        .select({
          userId: users.id,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, updated.userId))
        .limit(1);

      if (!owner || !owner.email) {
        throw new NotFoundException({
          success: false,
          error: {
            code: "ORGANIZER_ACCOUNT_NOT_FOUND",
            message: "Không tìm thấy tài khoản người dùng của Ban tổ chức",
            timestamp: new Date().toISOString(),
          },
        });
      }

      // 4. Ghi nhật ký Admin (Audit Log)
      await tx.insert(auditLog).values({
        actorId: adminId,
        actorRole: UserRole.ADMIN,
        action:
          decision === "APPROVE" ? "ORGANIZER_APPROVED" : "ORGANIZER_REJECTED",
        targetType: "ORGANIZER_PROFILE",
        targetId: updated.id,
        changes: {
          oldStatus: OrganizerStatus.PENDING_VERIFICATION,
          newStatus,
          reason: reason ?? null,
        },
        ipAddress: meta?.ipAddress ?? null,
        userAgent: meta?.userAgent ?? null,
      });

      // 5. Tạo Outbox event để xử lý thông báo bất đồng bộ
      await tx.insert(outbox).values({
        eventType:
          decision === "APPROVE" ? "ORGANIZER_APPROVED" : "ORGANIZER_REJECTED",
        payload: {
          profileId: updated.id,
          userId: updated.userId,
          email: owner.email,
          organizationName: updated.organizationName,
          decision,
          reason: reason ?? null,
        },
        status: OutboxStatus.PENDING,
      });

      return updated;
    });
  }

  async getPendingEvents() {
    const items = await db
      .select({
        id: events.id,
        title: events.title,
        organizerId: events.organizerId,
        organizationName: organizerProfiles.organizationName,
        status: events.status,
        version: events.version,
        startTime: events.startTime,
        createdAt: events.createdAt,
      })
      .from(events)
      .innerJoin(
        organizerProfiles,
        eq(events.organizerId, organizerProfiles.id),
      )
      .where(eq(events.status, EventStatus.PENDING_APPROVAL))
      .orderBy(desc(events.createdAt));

    return items;
  }

  async reviewEvent(
    eventId: string,
    adminId: string,
    dto: ReviewEventDto,
    meta?: AuditRequestMeta,
  ) {
    const { decision, reason } = dto;

    const newStatus =
      decision === "APPROVE" ? EventStatus.PUBLISHED : EventStatus.DRAFT;

    return db.transaction(async (tx) => {
      // 1. Kiểm tra tồn tại và trạng thái sự kiện
      const [existing] = await tx
        .select({
          id: events.id,
          title: events.title,
          organizerId: events.organizerId,
          status: events.status,
          version: events.version,
        })
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

      if (!existing) {
        throw new NotFoundException({
          success: false,
          error: {
            code: "EVENT_NOT_FOUND",
            message: "Không tìm thấy sự kiện",
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (existing.status !== EventStatus.PENDING_APPROVAL) {
        throw new ConflictException({
          success: false,
          error: {
            code: "EVENT_NOT_IN_REVIEW",
            message: "Sự kiện không ở trạng thái chờ phê duyệt",
            timestamp: new Date().toISOString(),
          },
        });
      }

      const expectedVersion = dto.version ?? existing.version;

      // 2. Cập nhật trạng thái và kiểm tra version
      const [updated] = await tx
        .update(events)
        .set({
          status: newStatus,
          rejectionReason: decision === "REJECT" ? reason : null,
          version: expectedVersion + 1,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(events.id, eventId),
            eq(events.status, EventStatus.PENDING_APPROVAL),
            eq(events.version, expectedVersion),
          ),
        )
        .returning();

      if (!updated) {
        throw new ConflictException({
          success: false,
          error: {
            code: "CONCURRENT_MODIFICATION",
            message: "Sự kiện đã được xử lý hoặc version không còn hợp lệ",
            timestamp: new Date().toISOString(),
          },
        });
      }

      // 3. Lấy thông tin Ban tổ chức
      const [owner] = await tx
        .select({
          userId: users.id,
          email: users.email,
        })
        .from(organizerProfiles)
        .innerJoin(users, eq(organizerProfiles.userId, users.id))
        .where(eq(organizerProfiles.id, updated.organizerId))
        .limit(1);

      if (!owner || !owner.email) {
        throw new NotFoundException({
          success: false,
          error: {
            code: "ORGANIZER_ACCOUNT_NOT_FOUND",
            message: "Không tìm thấy tài khoản người dùng của Ban tổ chức",
            timestamp: new Date().toISOString(),
          },
        });
      }

      // 4. Ghi Audit Log
      await tx.insert(auditLog).values({
        actorId: adminId,
        actorRole: UserRole.ADMIN,
        action: decision === "APPROVE" ? "EVENT_APPROVED" : "EVENT_REJECTED",
        targetType: "EVENT",
        targetId: updated.id,
        changes: {
          oldStatus: EventStatus.PENDING_APPROVAL,
          newStatus,
          reason: reason ?? null,
        },
        ipAddress: meta?.ipAddress ?? null,
        userAgent: meta?.userAgent ?? null,
      });

      // 5. Ghi Outbox để xử lý thông báo
      await tx.insert(outbox).values({
        eventType: decision === "APPROVE" ? "EVENT_APPROVED" : "EVENT_REJECTED",
        payload: {
          eventId: updated.id,
          organizerId: updated.organizerId,
          userId: owner.userId,
          email: owner.email,
          eventTitle: updated.title,
          decision,
          reason: reason ?? null,
        },
        status: OutboxStatus.PENDING,
      });

      return updated;
    });
  }
}
