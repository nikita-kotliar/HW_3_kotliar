import { Module } from '@nestjs/common';
import { HallsModule } from '../halls/halls.module';
import { ShowingsModule } from '../showings/showings.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

/**
 * Окремої колекції бронювань немає: вони лежать у документах сеансів.
 * Модель Showing надходить з ShowingsModule (exports: MongooseModule).
 */
@Module({
  imports: [ShowingsModule, HallsModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
