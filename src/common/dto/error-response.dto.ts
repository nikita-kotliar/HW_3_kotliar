import { ApiProperty } from '@nestjs/swagger';

/** Єдина структура відповіді з помилкою. */
export class ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Film with id "..." not found',
  })
  message: string | string[];

  @ApiProperty({ example: 'Not Found' })
  error: string;

  @ApiProperty({ example: '/films/665f1c2b9a1e4b3c2d1f0a9e' })
  path: string;

  @ApiProperty({ example: '2030-05-01T18:30:00.000Z' })
  timestamp: string;
}
