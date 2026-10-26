import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";

import { AdminService } from "./admin.service";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import {
  CurrentUser,
  AuthenticatedUser,
} from "../auth/decorators/current-user.decorator";

import {
  ApproveActionSchema,
  RejectActionSchema,
  ReviewEventSchema,
  ReviewOrganizerSchema,
  UserRole,
} from "@tickethub/shared";

function extractAuditMeta(req: FastifyRequest) {
  const forwarded = req.headers["x-forwarded-for"];
  const ipAddress =
    typeof forwarded === "string"
      ? forwarded.split(",")[0]?.trim()
      : req.ip || null;

  const userAgent =
    typeof req.headers["user-agent"] === "string"
      ? req.headers["user-agent"].slice(0, 255)
      : null;

  return { ipAddress, userAgent };
}

@Controller("api/v1/admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // GET /api/v1/admin/organizers
  // Lấy danh sách hồ sơ Ban tổ chức chờ duyệt
  @Get("organizers")
  async getPendingOrganizers() {
    const items = await this.adminService.getPendingOrganizers();

    return {
      success: true,
      data: items,
      meta: {
        total: items.length,
      },
    };
  }

  // POST /api/v1/admin/organizers/:id/approve
  // Phê duyệt hồ sơ Ban tổ chức
  @Post("organizers/:id/approve")
  @HttpCode(HttpStatus.OK)
  async approveOrganizer(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
    @Req() req: FastifyRequest,
  ) {
    const result = ApproveActionSchema.safeParse(body ?? {});
    if (!result.success) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Dữ liệu phê duyệt hồ sơ không hợp lệ",
          details: result.error.format(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const data = await this.adminService.reviewOrganizer(
      id,
      user.userId,
      {
        decision: "APPROVE",
        version: result.data.version,
      },
      extractAuditMeta(req),
    );

    return {
      success: true,
      data,
    };
  }

  // POST /api/v1/admin/organizers/:id/reject
  // Từ chối hồ sơ Ban tổ chức kèm lý do
  @Post("organizers/:id/reject")
  @HttpCode(HttpStatus.OK)
  async rejectOrganizer(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
    @Req() req: FastifyRequest,
  ) {
    const result = RejectActionSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Từ chối hồ sơ Ban tổ chức bắt buộc phải có lý do",
          details: result.error.format(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const data = await this.adminService.reviewOrganizer(
      id,
      user.userId,
      {
        decision: "REJECT",
        reason: result.data.reason,
        version: result.data.version,
      },
      extractAuditMeta(req),
    );

    return {
      success: true,
      data,
    };
  }

  // POST /api/v1/admin/organizers/:id/review
  // Alias duyệt hoặc từ chối hồ sơ Ban tổ chức
  @Post("organizers/:id/review")
  @HttpCode(HttpStatus.OK)
  async reviewOrganizer(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
    @Req() req: FastifyRequest,
  ) {
    const result = ReviewOrganizerSchema.safeParse(body);

    if (!result.success) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Dữ liệu duyệt hồ sơ không hợp lệ",
          details: result.error.format(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const data = await this.adminService.reviewOrganizer(
      id,
      user.userId,
      result.data,
      extractAuditMeta(req),
    );

    return {
      success: true,
      data,
    };
  }

  // GET /api/v1/admin/events
  // Lấy danh sách sự kiện chờ duyệt
  @Get("events")
  async getPendingEvents() {
    const items = await this.adminService.getPendingEvents();

    return {
      success: true,
      data: items,
      meta: {
        total: items.length,
      },
    };
  }

  // POST /api/v1/admin/events/:id/approve
  // Phê duyệt sự kiện chuyển sang trạng thái PUBLISHED
  @Post("events/:id/approve")
  @HttpCode(HttpStatus.OK)
  async approveEvent(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
    @Req() req: FastifyRequest,
  ) {
    const result = ApproveActionSchema.safeParse(body ?? {});
    if (!result.success) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Dữ liệu phê duyệt sự kiện không hợp lệ",
          details: result.error.format(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const data = await this.adminService.reviewEvent(
      id,
      user.userId,
      {
        decision: "APPROVE",
        version: result.data.version,
      },
      extractAuditMeta(req),
    );

    return {
      success: true,
      data,
    };
  }

  // POST /api/v1/admin/events/:id/reject
  // Từ chối sự kiện kèm lý do chuyển về DRAFT
  @Post("events/:id/reject")
  @HttpCode(HttpStatus.OK)
  async rejectEvent(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
    @Req() req: FastifyRequest,
  ) {
    const result = RejectActionSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Từ chối sự kiện bắt buộc phải có lý do",
          details: result.error.format(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const data = await this.adminService.reviewEvent(
      id,
      user.userId,
      {
        decision: "REJECT",
        reason: result.data.reason,
        version: result.data.version,
      },
      extractAuditMeta(req),
    );

    return {
      success: true,
      data,
    };
  }

  // POST /api/v1/admin/events/:id/review
  // Alias duyệt hoặc từ chối sự kiện
  @Post("events/:id/review")
  @HttpCode(HttpStatus.OK)
  async reviewEvent(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
    @Req() req: FastifyRequest,
  ) {
    const result = ReviewEventSchema.safeParse(body);

    if (!result.success) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Dữ liệu duyệt sự kiện không hợp lệ",
          details: result.error.format(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const data = await this.adminService.reviewEvent(
      id,
      user.userId,
      result.data,
      extractAuditMeta(req),
    );

    return {
      success: true,
      data,
    };
  }
}
