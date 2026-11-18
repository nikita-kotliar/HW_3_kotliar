import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FilmsModule } from '../films/films.module';
import { HallsModule } from '../halls/halls.module';
import { Showing, ShowingSchema } from './schemas/showing.schema';
import { ShowingsController } from './showings.controller';
import { ShowingsService } from './showings.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Showing.name, schema: ShowingSchema }]),
    forwardRef(() => FilmsModule),
    forwardRef(() => HallsModule),
  ],
  controllers: [ShowingsController],
  providers: [ShowingsService],
  // Модель Showing потрібна BookingsModule: бронювання лежать у документі сеансу.
  exports: [ShowingsService, MongooseModule],
})
export class ShowingsModule {}
