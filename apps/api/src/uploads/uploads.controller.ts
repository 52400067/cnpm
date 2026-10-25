import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";

import { z } from "zod";
import { UserRole } from "@tickethub/shared";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

import {
  CurrentUser,
  type AuthenticatedUser,
} from "../auth/decorators/current-user.decorator";

import { UploadsService } from "./uploads.service";

// Kiem tra du lieu anh tu Postman / Frontend
const PresignImageSchema = z
  .object({
    filename: z.string().trim().min(1).max(200),

    contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),

    sizeBytes: z
      .number()
      .int()
      .positive()
      .max(5 * 1024 * 1024),
  })
  .strict()
  .refine(
    (data) => {
      switch (data.contentType) {
        case "image/jpeg":
          return /\.jpe?g$/i.test(data.filename);

        case "image/png":
          return /\.png$/i.test(data.filename);

        case "image/webp":
          return /\.webp$/i.test(data.filename);

        default:
          return false;
      }
    },
    {
      message: "Duoi file khong khop voi loai anh",
      path: ["filename"],
    },
  );

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
    // 1. Validate du lieu dau vao
    const result = PresignImageSchema.safeParse(body);

    if (!result.success) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Du lieu anh khong hop le",
          details: result.error.format(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Goi Service tao Presigned URL
    const data = await this.uploadsService.presignEventImage(
      user.userId,
      result.data,
    );

    // 3. Tra ket qua cho client
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
    // 1. Validate du lieu
    const result = ConfirmImageSchema.safeParse(body);

    if (!result.success) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Object key khong hop le",
          details: result.error.format(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Xac nhan anh tren AWS S3
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
const ConfirmImageSchema = z
  .object({
    key: z.string().trim().min(1).max(250),
  })
  .strict();
