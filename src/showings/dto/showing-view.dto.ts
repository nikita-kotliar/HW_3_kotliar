import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

const OBJECT_ID_EXAMPLE = '665f1c2b9a1e4b3c2d1f0a9e';

interface ShowingCore {
  _id: Types.ObjectId;
  startsAt: Date;
  price: number;
}

/** Відповідь на POST /showings: без масивів seats і bookings. */
export class ShowingResponseDto {
  @ApiProperty({ example: OBJECT_ID_EXAMPLE, description: 'ObjectId' })
  id: string;

  @ApiProperty({ example: OBJECT_ID_EXAMPLE, description: 'ObjectId фільму' })
  filmId: string;

  @ApiProperty({ example: OBJECT_ID_EXAMPLE, description: 'ObjectId залу' })
  hallId: string;

  @ApiProperty({ example: '2030-05-01T18:30:00.000Z' })
  startsAt: Date;

  @ApiProperty({ example: 12500, description: 'Ціна квитка в копійках' })
  price: number;

  static fromDocument(
    doc: ShowingCore & { film: Types.ObjectId; hall: Types.ObjectId },
  ): ShowingResponseDto {
    return {
      id: doc._id.toString(),
      filmId: doc.film.toString(),
      hallId: doc.hall.toString(),
      startsAt: doc.startsAt,
      price: doc.price,
    };
  }
}

/** Сеанс з назвами фільму й залу (після populate), без seats і bookings. */
export class ShowingViewDto {
  @ApiProperty({ example: OBJECT_ID_EXAMPLE, description: 'ObjectId' })
  id: string;

  @ApiProperty({ example: 'Dune: Part Two' })
  filmTitle: string;

  @ApiProperty({ example: 'Зал 1' })
  hallName: string;

  @ApiProperty({ example: '2030-05-01T18:30:00.000Z' })
  startsAt: Date;

  @ApiProperty({ example: 12500, description: 'Ціна квитка в копійках' })
  price: number;

  static fromPopulated(
    doc: ShowingCore & { film: { title: string }; hall: { name: string } },
  ): ShowingViewDto {
    return {
      id: doc._id.toString(),
      filmTitle: doc.film.title,
      hallName: doc.hall.name,
      startsAt: doc.startsAt,
      price: doc.price,
    };
  }
}

/** Сторінка сеансів для GET /showings. */
export class ShowingsPageDto {
  @ApiProperty({ type: [ShowingViewDto] })
  items: ShowingViewDto[];

  @ApiProperty({
    example: 42,
    description: 'Кількість сеансів, що відповідають фільтрам',
  })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
