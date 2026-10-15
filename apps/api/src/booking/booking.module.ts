import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingCleanupTask } from './booking-cleanup.task';
import { AuthModule } from '../auth/auth.module';
import { WaitingRoomModule } from '../waiting-room/waiting-room.module';

@Module({
  imports: [AuthModule, WaitingRoomModule],
  controllers: [BookingController],
  providers: [BookingService, BookingCleanupTask],
  exports: [BookingService],
})
export class BookingModule {}
