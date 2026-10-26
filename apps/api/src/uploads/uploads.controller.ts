import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";

import {
  ConfirmImageSchema,
  PresignImageSchema,
  UserRole,
} from "@tickethub/shared";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

import {
  CurrentUser,
  type AuthenticatedUser,
} from "../auth/decorators/current-user.decorator";

import { UploadsService } from "./uploads.service";

@Controller("api/v1/uploads")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ORGANIZER)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post("event-image/presign")
  @HttpCode(HttpStatus.OK)
  async presignEventImage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    const result = PresignImageSchema.safeParse(body);

    if (!result.success) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Dữ liệu yêu cầu tải ảnh không hợp lệ",
          details: result.error.format(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const data = await this.uploadsService.presignEventImage(
      user.userId,
      result.data,
    );

    return {
      success: true,
      data,
    };
  }

  @Post("event-image/confirm")
  @HttpCode(HttpStatus.OK)
  async confirmEventImage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    const result = ConfirmImageSchema.safeParse(body);

    if (!result.success) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Khóa tập tin xác nhận không hợp lệ",
          details: result.error.format(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const data = await this.uploadsService.confirmEventImage(
      user.userId,
      result.data.key,
    );

    return {
      success: true,
      data,
    };
  }
}
