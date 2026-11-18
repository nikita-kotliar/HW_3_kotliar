import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Hall } from '../schemas/hall.schema';

type HallLike = Hall & { _id: Types.ObjectId };

export class SeatPositionDto {
  @ApiProperty({ example: 1 })
  row: number;

  @ApiProperty({ example: 5 })
  seat: number;
}

export class HallResponseDto {
  @ApiProperty({ example: '665f1c2b9a1e4b3c2d1f0a9e', description: 'ObjectId' })
  id: string;

  @ApiProperty({ example: 'Зал 1' })
  name: string;

  @ApiProperty({ example: 3 })
  rows: number;

  @ApiProperty({ example: 5 })
  seatsPerRow: number;

  static fromDocument(doc: HallLike): HallResponseDto {
    return {
      id: doc._id.toString(),
      name: doc.name,
      rows: doc.rows,
      seatsPerRow: doc.seatsPerRow,
    };
  }
}

export class HallWithSeatsDto extends HallResponseDto {
  @ApiProperty({ type: [SeatPositionDto] })
  seats: SeatPositionDto[];
}

/** Перелік місць залу: ряди 1..rows, у кожному місця 1..seatsPerRow. */
export function expandHallSeats(
  hall: Pick<Hall, 'rows' | 'seatsPerRow'>,
): SeatPositionDto[] {
  const seats: SeatPositionDto[] = [];
  for (let row = 1; row <= hall.rows; row++) {
    for (let seat = 1; seat <= hall.seatsPerRow; seat++) {
      seats.push({ row, seat });
    }
  }
  return seats;
}
