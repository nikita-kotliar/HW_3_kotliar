import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class CreateHallDto {
  @ApiProperty({ example: 'Зал 1', description: 'Унікальна назва залу' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 3, description: 'Кількість рядів' })
  @IsInt()
  @IsPositive()
  rows: number;

  @ApiProperty({ example: 5, description: 'Кількість місць у ряду' })
  @IsInt()
  @IsPositive()
  seatsPerRow: number;
}
