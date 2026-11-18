import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsISO8601, IsPositive, IsMongoId } from 'class-validator';

export class CreateShowingDto {
  @ApiProperty({
    format: 'ObjectId',
    pattern: '^[0-9a-fA-F]{24}$',
    description: 'Ідентифікатор фільму',
  })
  @IsMongoId({ message: 'filmId must be a valid ObjectId (24 hex characters)' })
  filmId: string;

  @ApiProperty({
    format: 'ObjectId',
    pattern: '^[0-9a-fA-F]{24}$',
    description: 'Ідентифікатор залу',
  })
  @IsMongoId({ message: 'hallId must be a valid ObjectId (24 hex characters)' })
  hallId: string;

  @ApiProperty({
    example: '2030-05-01T18:30:00Z',
    description: 'Початок сеансу, ISO 8601, не в минулому',
  })
  @IsISO8601(
    { strict: true },
    { message: 'startsAt must be a valid ISO 8601 date' },
  )
  startsAt: string;

  @ApiProperty({ example: 12500, description: 'Ціна квитка в копійках' })
  @IsInt()
  @IsPositive()
  price: number;
}
