import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { SeatPositionDto } from '../../halls/dto/hall-with-seats.dto';
import { ShowingBooking } from '../../showings/schemas/showing-booking.schema';

export class BookingResponseDto {
  @ApiProperty({ example: '665f1c2b9a1e4b3c2d1f0a9e', description: 'ObjectId' })
  id: string;

  @ApiProperty({
    example: '665f1c2b9a1e4b3c2d1f0a9f',
    description: 'ObjectId сеансу',
  })
  showingId: string;

  @ApiProperty({ type: [SeatPositionDto] })
  seats: SeatPositionDto[];

  @ApiProperty({
    example: 25000,
    description: 'Ціна сеансу, помножена на кількість місць, у копійках',
  })
  totalPrice: number;

  @ApiProperty({ example: '2030-05-01T12:00:00.000Z' })
  createdAt: Date;

  static fromEmbedded(
    booking: ShowingBooking,
    showingId: Types.ObjectId | string,
  ): BookingResponseDto {
    return {
      id: booking._id.toString(),
      showingId: showingId.toString(),
      seats: booking.seats.map(({ row, seat }) => ({ row, seat })),
      totalPrice: booking.totalPrice,
      createdAt: booking.createdAt,
    };
  }
}

export class SeatAvailabilityDto extends SeatPositionDto {
  @ApiProperty({ example: false })
  isBooked: boolean;
}
