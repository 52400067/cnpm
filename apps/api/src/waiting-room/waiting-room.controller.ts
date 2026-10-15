import {
  Controller,
  Post,
  Param,
  UseGuards,
  Res,
  HttpStatus,
} from "@nestjs/common";
import { FastifyReply } from "fastify";
import { WaitingRoomService } from "./waiting-room.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  CurrentUser,
  AuthenticatedUser,
} from "../auth/decorators/current-user.decorator";

@Controller("api/v1/waiting-room")
@UseGuards(JwtAuthGuard)
export class WaitingRoomController {
  constructor(private readonly waitingRoomService: WaitingRoomService) {}

  @Post(":eventId/join")
  async joinQueue(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const result = await this.waitingRoomService.joinQueue(
      user.userId,
      eventId,
    );

    if (result.status === "QUEUED") {
      res.status(HttpStatus.ACCEPTED);
    } else {
      res.status(HttpStatus.OK);
    }

    return {
      success: true,
      data: result,
    };
  }

  @Post(":eventId/heartbeat")
  async heartbeat(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const result = await this.waitingRoomService.heartbeat(
      user.userId,
      eventId,
    );

    if (result.status === "QUEUED") {
      res.status(HttpStatus.ACCEPTED);
    } else {
      res.status(HttpStatus.OK);
    }

    return {
      success: true,
      data: result,
    };
  }
}
