import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

const positiveInteger = {
  validator: (v: number) => Number.isInteger(v) && v > 0,
  message: 'must be a positive integer',
};

@Schema({ collection: 'halls', versionKey: false })
export class Hall {
  @Prop({ required: true, trim: true, unique: true })
  name: string;

  @Prop({ required: true, validate: positiveInteger })
  rows: number;

  @Prop({ required: true, validate: positiveInteger })
  seatsPerRow: number;
}

export type HallDocument = HydratedDocument<Hall>;
export const HallSchema = SchemaFactory.createForClass(Hall);
