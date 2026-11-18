import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

/**
 * Перевіряє, що параметр маршруту має формат ObjectId (24 hex-символи),
 * до будь-якого звернення до бази. Повертає рядок без змін.
 */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (typeof value !== 'string' || !OBJECT_ID_PATTERN.test(value)) {
      throw new BadRequestException(
        `"${value}" is not a valid id: expected a 24-character hex ObjectId`,
      );
    }
    return value;
  }
}
