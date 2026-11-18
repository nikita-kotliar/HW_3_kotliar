import { ApiParam } from '@nestjs/swagger';

/** Swagger-опис параметра :id у форматі ObjectId. */
export const ApiObjectIdParam = (name = 'id', description?: string) =>
  ApiParam({
    name,
    description: description ?? 'ObjectId: 24 hex-символи',
    schema: {
      type: 'string',
      pattern: '^[0-9a-fA-F]{24}$',
      example: '665f1c2b9a1e4b3c2d1f0a9e',
    },
  });
