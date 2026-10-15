import { Module } from '@nestjs/common';
import { RedisModule } from './database/redis.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { WaitingRoomModule } from './waiting-room/waiting-room.module';
import { BookingModule } from './booking/booking.module';

@Module({
  imports: [
    RedisModule,
    HealthModule,
    AuthModule,
    EventsModule,
    WaitingRoomModule,
    BookingModule,
  ],
})
export class AppModule {}
