import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { BookingService } from "./booking.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  CurrentUser,
  AuthenticatedUser,
} from "../auth/decorators/current-user.decorator";
import {
  HoldSeatsRequestSchema,
  ReleaseHoldRequestSchema,
} from "@tickethub/shared";

@Controller("api/v1/booking")
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post("hold")
  @HttpCode(HttpStatus.CREATED)
  async holdSeats(
    @CurrentUser() user: AuthenticatedUser,
    @Headers("x-admission-token") admissionToken: string | undefined,
    @Body() body: unknown,
  ) {
    const parseResult = HoldSeatsRequestSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Dữ liệu giữ chỗ vé không hợp lệ",
          details: parseResult.error.format(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const data = await this.bookingService.holdSeats(
      user.userId,
      parseResult.data,
      admissionToken,
    );

    return {
      success: true,
      data,
    };
  }

  @Post("release")
  @HttpCode(HttpStatus.OK)
  async releaseHold(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    const parseResult = ReleaseHoldRequestSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Yêu cầu định danh mã đơn hàng hợp lệ",
          timestamp: new Date().toISOString(),
        },
      });
    }

    const data = await this.bookingService.releaseHold(
      user.userId,
      parseResult.data.orderId,
    );

    return {
      success: true,
      data,
    };
  }

  @Get("orders/:orderId")
  async getOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param("orderId") orderId: string,
  ) {
    const data = await this.bookingService.getOrderById(user.userId, orderId);

    return {
      success: true,
      data,
    };
  }
}
