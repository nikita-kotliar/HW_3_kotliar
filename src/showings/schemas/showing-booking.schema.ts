import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';

/** Позиція місця в бронюванні: ряд і номер. */
@Schema({ _id: false, versionKey: false })
export class SeatPosition {
  @Prop({ required: true })
  row: number;

  @Prop({ required: true })
  seat: number;
}

export const SeatPositionSchema = SchemaFactory.createForClass(SeatPosition);

/**
 * Бронювання всередині документа сеансу.
 * _id генерується в коді до оновлення, бо той самий id проставляється в seats[].bookingId.
 */
@Schema({ versionKey: false })
export class ShowingBooking {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  _id: Types.ObjectId;

  @Prop({ type: [SeatPositionSchema], required: true })
  seats: SeatPosition[];

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ required: true, default: () => new Date() })
  createdAt: Date;
}

export const ShowingBookingSchema =
  SchemaFactory.createForClass(ShowingBooking);
