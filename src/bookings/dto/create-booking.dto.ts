import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsInt,
  IsPositive,
  ValidateNested,
} from 'class-validator';

export class SeatDto {
  @ApiProperty({ example: 1, description: 'Номер ряду' })
  @IsInt()
  @IsPositive()
  row: number;

  @ApiProperty({ example: 3, description: 'Номер місця в ряду' })
  @IsInt()
  @IsPositive()
  seat: number;
}

export class CreateBookingDto {
  @ApiProperty({
    type: [SeatDto],
    example: [
      { row: 1, seat: 3 },
      { row: 1, seat: 4 },
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique((s: SeatDto) => `${s?.row}:${s?.seat}`, {
    message: 'seats must not contain the same seat twice',
  })
  @ValidateNested({ each: true })
  @Type(() => SeatDto)
  seats: SeatDto[];
}
