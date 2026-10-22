import {
  Controller,
  Post,
  Param,
  ParseUUIDPipe,
  Ip,
  Inject,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  CurrentUser,
  AuthenticatedUser,
} from "../auth/decorators/current-user.decorator";

import { PaymentService } from "./payment.service";

@Controller("api/v1/payments")
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(
    @Inject(PaymentService)
    private readonly paymentService: PaymentService,
  ) {}

  @Post("orders/:orderId/vnpay")
  async createPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("orderId", new ParseUUIDPipe()) orderId: string,
    @Ip() clientIp: string,
  ) {
    const data = await this.paymentService.createVnpayPayment(
      user.userId,
      orderId,
      clientIp,
    );

    return {
      success: true,
      data,
    };
  }
}
