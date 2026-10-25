import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";

import { eq, and, desc } from "drizzle-orm";
import { db } from "../database/db";

import {
  organizerProfiles,
  users,
  events,
  auditLog,
  outbox,
} from "../database/schema";

import {
  OrganizerStatus,
  EventStatus,
  OutboxStatus,
  UserRole,
} from "@tickethub/shared";

export interface ReviewOrganizerDto {
  decision: "APPROVE" | "REJECT";
  reason?: string | undefined;
  version: number;
}
export interface ReviewEventDto {
  decision: "APPROVE" | "REJECT";
  reason?: string | undefined;
  version: number;
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
  ) {
    const { decision, reason, version } = dto;

    const newStatus =
      decision === "APPROVE"
        ? OrganizerStatus.VERIFIED
        : OrganizerStatus.REJECTED;

    return db.transaction(async (tx) => {
      // 1. Cập nhật hồ sơ nếu trạng thái và version hợp lệ
      const [updated] = await tx
        .update(organizerProfiles)
        .set({
          status: newStatus,
          rejectionReason: decision === "REJECT" ? reason : null,
          verifiedBy: decision === "APPROVE" ? adminId : null,
          verifiedAt: decision === "APPROVE" ? new Date() : null,
          version: version + 1,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(organizerProfiles.id, profileId),
            eq(organizerProfiles.status, OrganizerStatus.PENDING_VERIFICATION),
            eq(organizerProfiles.version, version),
          ),
        )
        .returning();

      // 2. Kiểm tra hồ sơ không tồn tại hoặc đã được xử lý
      if (!updated) {
        const [existing] = await tx
          .select({ id: organizerProfiles.id })
          .from(organizerProfiles)
          .where(eq(organizerProfiles.id, profileId))
          .limit(1);

        if (!existing) {
          throw new NotFoundException("Không tìm thấy hồ sơ Ban tổ chức");
        }

        throw new ConflictException(
          "Hồ sơ đã được xử lý hoặc version không còn hợp lệ",
        );
      }

      // 3. Lấy email Ban tổ chức
      const [owner] = await tx
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, updated.userId))
        .limit(1);

      // 4. Ghi nhật ký Admin
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
      });

      // 5. Tạo Outbox event để xử lý thông báo
      await tx.insert(outbox).values({
        eventType:
          decision === "APPROVE" ? "ORGANIZER_APPROVED" : "ORGANIZER_REJECTED",
        payload: {
          profileId: updated.id,
          userId: updated.userId,
          email: owner?.email ?? null,
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

  async reviewEvent(eventId: string, adminId: string, dto: ReviewEventDto) {
    const { decision, reason, version } = dto;

    const newStatus =
      decision === "APPROVE" ? EventStatus.PUBLISHED : EventStatus.DRAFT;

    return db.transaction(async (tx) => {
      // 1. Cập nhật trạng thái và kiểm tra version
      const [updated] = await tx
        .update(events)
        .set({
          status: newStatus,
          rejectionReason: decision === "REJECT" ? reason : null,
          version: version + 1,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(events.id, eventId),
            eq(events.status, EventStatus.PENDING_APPROVAL),
            eq(events.version, version),
          ),
        )
        .returning();

      // 2. Kiểm tra sự kiện đã được xử lý chưa
      if (!updated) {
        const [existing] = await tx
          .select({ id: events.id })
          .from(events)
          .where(eq(events.id, eventId))
          .limit(1);

        if (!existing) {
          throw new NotFoundException("Không tìm thấy sự kiện");
        }

        throw new ConflictException(
          "Sự kiện đã được xử lý hoặc version không hợp lệ",
        );
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

      if (!owner) {
        throw new Error("Không tìm thấy tài khoản Ban tổ chức");
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
