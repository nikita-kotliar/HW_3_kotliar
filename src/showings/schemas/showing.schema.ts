import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Film } from '../../films/schemas/film.schema';
import { Hall } from '../../halls/schemas/hall.schema';
import { ShowingBooking, ShowingBookingSchema } from './showing-booking.schema';
import { ShowingSeat, ShowingSeatSchema } from './showing-seat.schema';

/**
 * Сеанс разом з місцями та бронюваннями.
 * Оновлення одного документа в MongoDB неподільне, тому зайняття місць
 * і запис бронювання виконуються одним updateOne без транзакції.
 */
@Schema({ collection: 'showings', versionKey: false })
export class Showing {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Film.name, required: true })
  film: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Hall.name, required: true })
  hall: Types.ObjectId;

  @Prop({ required: true })
  startsAt: Date;

  @Prop({
    required: true,
    validate: {
      validator: (v: number) => Number.isInteger(v) && v > 0,
      message: 'price must be a positive integer (kopecks)',
    },
  })
  price: number;

  @Prop({ type: [ShowingSeatSchema], default: [] })
  seats: ShowingSeat[];

  @Prop({ type: [ShowingBookingSchema], default: [] })
  bookings: ShowingBooking[];
}

export type ShowingDocument = HydratedDocument<Showing>;
export const ShowingSchema = SchemaFactory.createForClass(Showing);

// Розклад: фільтр за фільмом/датою і сортування за startsAt, потім _id.
ShowingSchema.index({ startsAt: 1, _id: 1 });
ShowingSchema.index({ film: 1, startsAt: 1 });
ShowingSchema.index({ hall: 1 });
// Пошук сеансу за вкладеним бронюванням (DELETE /bookings/:id).
ShowingSchema.index({ 'bookings._id': 1 });
