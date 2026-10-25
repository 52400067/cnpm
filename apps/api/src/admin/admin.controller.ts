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
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";

import { AdminService } from "./admin.service";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import {
  CurrentUser,
  AuthenticatedUser,
} from "../auth/decorators/current-user.decorator";

import { UserRole } from "@tickethub/shared";

// Schema kiểm tra dữ liệu khi Admin duyệt hồ sơ
const ReviewOrganizerSchema = z
  .object({
    decision: z.enum(["APPROVE", "REJECT"]),
    reason: z.string().trim().min(1).max(500).optional(),
    version: z.number().int().positive(),
  })
  .strict()
  .refine((data) => data.decision === "APPROVE" || Boolean(data.reason), {
    message: "Từ chối hồ sơ phải có lý do",
    path: ["reason"],
  });

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
      data: {
        items,
        total: items.length,
      },
    };
  }

  // POST /api/v1/admin/organizers/:id/review
  // Duyệt hoặc từ chối hồ sơ Ban tổ chức
  @Post("organizers/:id/review")
  @HttpCode(HttpStatus.OK)
  async reviewOrganizer(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    // 1. Kiểm tra dữ liệu đầu vào
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

    // 2. Gọi Service xử lý duyệt hoặc từ chối
    const data = await this.adminService.reviewOrganizer(
      id,
      user.userId,
      result.data,
    );

    // 3. Trả kết quả cho Client
    return {
      success: true,
      data,
    };
  }

  @Get("events")
  async getPendingEvents() {
    const items = await this.adminService.getPendingEvents();

    return {
      success: true,
      data: {
        items,
        total: items.length,
      },
    };
  }

  @Post("events/:id/review")
  @HttpCode(HttpStatus.OK)
  async reviewEvent(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    // Kiểm tra dữ liệu đầu vào
    const result = ReviewOrganizerSchema.safeParse(body);

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

    // Gọi Service thực hiện nghiệp vụ
    const data = await this.adminService.reviewEvent(
      id,
      user.userId,
      result.data,
    );

    return {
      success: true,
      data,
    };
  }
}
