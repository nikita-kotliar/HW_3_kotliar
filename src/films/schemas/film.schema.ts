import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'films', versionKey: false })
export class Film {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({
    required: true,
    min: 1,
    validate: { validator: Number.isInteger, message: 'must be an integer' },
  })
  durationMinutes: number;

  @Prop({ required: true })
  releaseYear: number;
}

export type FilmDocument = HydratedDocument<Film>;
export const FilmSchema = SchemaFactory.createForClass(Film);
