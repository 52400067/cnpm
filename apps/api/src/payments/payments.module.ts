import { Module } from "@nestjs/common";

import { VnpayIpnPreviewController } from "./vnpay-ipn.preview.controller";
import { VnpayIpnPreviewService } from "./vnpay-ipn.preview.service";

import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";

import { VnpayIpnController } from "./vnpay-ipn.controller";
import { VnpayIpnService } from "./vnpay-ipn.service";

@Module({
  controllers: [
    PaymentController,
    VnpayIpnPreviewController,
    VnpayIpnController,
  ],
  providers: [PaymentService, VnpayIpnPreviewService, VnpayIpnService],
})
export class PaymentsModule {}
