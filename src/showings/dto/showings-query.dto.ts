import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsMongoId,
  Matches,
  Max,
  Min,
} from 'class-validator';

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export class ShowingsQueryDto {
  @ApiPropertyOptional({
    format: 'ObjectId',
    pattern: '^[0-9a-fA-F]{24}$',
    description: 'Залишити сеанси лише цього фільму',
  })
  @IsOptional()
  @IsMongoId({ message: 'filmId must be a valid ObjectId (24 hex characters)' })
  filmId?: string;

  @ApiPropertyOptional({
    example: '2030-05-01',
    description: 'Залишити сеанси, що починаються цієї доби (UTC), YYYY-MM-DD',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must match YYYY-MM-DD' })
  @IsISO8601({ strict: true }, { message: 'date must be a real calendar date' })
  date?: string;

  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
    description: 'Номер сторінки',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 20,
    description: 'Кількість записів на сторінці',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({
    enum: SORT_ORDERS,
    default: 'asc',
    description:
      'Порядок за часом початку; при рівності сеанси впорядковані за id',
  })
  @IsOptional()
  @IsIn(SORT_ORDERS)
  sort: SortOrder = 'asc';
}
