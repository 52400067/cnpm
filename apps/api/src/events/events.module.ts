import { Module } from "@nestjs/common";
import { EventsService } from "./events.service";
import {
  OrganizerEventsController,
  PublicEventsController,
} from "./events.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [OrganizerEventsController, PublicEventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
