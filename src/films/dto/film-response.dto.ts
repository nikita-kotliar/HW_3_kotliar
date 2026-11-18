import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Film } from '../schemas/film.schema';

type FilmLike = Film & { _id: Types.ObjectId };

export class FilmResponseDto {
  @ApiProperty({ example: '665f1c2b9a1e4b3c2d1f0a9e', description: 'ObjectId' })
  id: string;

  @ApiProperty({ example: 'Dune: Part Two' })
  title: string;

  @ApiProperty({ example: 166 })
  durationMinutes: number;

  @ApiProperty({ example: 2024 })
  releaseYear: number;

  static fromDocument(doc: FilmLike): FilmResponseDto {
    return {
      id: doc._id.toString(),
      title: doc.title,
      durationMinutes: doc.durationMinutes,
      releaseYear: doc.releaseYear,
    };
  }
}
