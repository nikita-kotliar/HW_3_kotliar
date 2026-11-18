import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';

/** Місце залу всередині документа сеансу. bookingId === null: місце вільне. */
@Schema({ _id: false, versionKey: false })
export class ShowingSeat {
  @Prop({ required: true })
  row: number;

  @Prop({ required: true })
  seat: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, default: null })
  bookingId: Types.ObjectId | null;
}

export const ShowingSeatSchema = SchemaFactory.createForClass(ShowingSeat);
