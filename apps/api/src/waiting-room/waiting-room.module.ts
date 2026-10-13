import { Module } from '@nestjs/common';
import { WaitingRoomController } from './waiting-room.controller';
import { WaitingRoomService } from './waiting-room.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [WaitingRoomController],
  providers: [WaitingRoomService],
  exports: [WaitingRoomService],
})
export class WaitingRoomModule {}
