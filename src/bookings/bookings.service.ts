import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SeatPositionDto } from '../halls/dto/hall-with-seats.dto';
import { HallsService } from '../halls/halls.service';
import { ShowingBooking } from '../showings/schemas/showing-booking.schema';
import { ShowingSeat } from '../showings/schemas/showing-seat.schema';
import { Showing } from '../showings/schemas/showing.schema';
import { ShowingsService } from '../showings/showings.service';
import {
  BookingResponseDto,
  SeatAvailabilityDto,
} from './dto/booking-response.dto';
import { CreateBookingDto } from './dto/create-booking.dto';

const seatKey = (s: SeatPositionDto) => `${s.row}:${s.seat}`;

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Showing.name) private readonly showingModel: Model<Showing>,
    private readonly showingsService: ShowingsService,
    private readonly hallsService: HallsService,
  ) {}

  /**
   * Бронювання одним updateOne документа сеансу:
   * - фільтр вимагає, щоб КОЖНЕ місце зі списку було вільним ($and з $elemMatch);
   * - оновлення проставляє bookingId цим місцям (arrayFilters) і додає запис до bookings ($push).
   * Оновлення одного документа неподільне, тож два паралельні запити на те саме місце
   * виконаються послідовно, і другий отримає matchedCount = 0.
   */
  async create(
    showingId: string,
    dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    // Перевірки до оновлення: існування сеансу й межі залу.
    // Повтори місць відсіює DTO (ArrayUnique). Тому matchedCount = 0 нижче означає лише конфлікт.
    const showing = await this.showingModel
      .findById(showingId)
      .select('hall price')
      .lean<{ _id: Types.ObjectId; hall: Types.ObjectId; price: number }>();
    if (!showing) throw this.showingsService.notFound(showingId);

    const hall = await this.hallsService.find(showing.hall);
    if (!hall) {
      throw new NotFoundException(`Hall of showing "${showingId}" not found`);
    }
    const outside = dto.seats.filter(
      (s) => !this.hallsService.hasSeat(hall, s),
    );
    if (outside.length) {
      throw new BadRequestException(
        `Seats not in hall "${hall.name}" (${hall.rows}x${hall.seatsPerRow}): ` +
          outside.map(seatKey).join(', '),
      );
    }

    const seats = dto.seats.map(({ row, seat }) => ({ row, seat }));
    const booking: ShowingBooking = {
      _id: new Types.ObjectId(),
      seats,
      totalPrice: showing.price * seats.length,
      createdAt: new Date(),
    };

    const result = await this.showingModel.updateOne(
      {
        _id: showing._id,
        $and: seats.map((s) => ({
          seats: {
            $elemMatch: { row: s.row, seat: s.seat, bookingId: null },
          },
        })),
      },
      {
        $set: { 'seats.$[target].bookingId': booking._id },
        $push: { bookings: booking },
      },
      {
        arrayFilters: [
          {
            $or: seats.map((s) => ({
              'target.row': s.row,
              'target.seat': s.seat,
            })),
          },
        ],
      },
    );

    if (result.matchedCount === 0) {
      throw new ConflictException(
        'One or more of the requested seats are already booked for this showing',
      );
    }
    return BookingResponseDto.fromEmbedded(booking, showing._id);
  }

  async findAll(): Promise<BookingResponseDto[]> {
    // Бронювання лежать у документах сеансів: збираємо їх з усіх сеансів.
    const showings = await this.showingModel
      .find({ 'bookings.0': { $exists: true } })
      .select('bookings')
      .sort({ _id: 1 })
      .lean<{ _id: Types.ObjectId; bookings: ShowingBooking[] }[]>();
    return showings
      .flatMap((s) =>
        s.bookings.map((b) => BookingResponseDto.fromEmbedded(b, s._id)),
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async findByShowing(showingId: string): Promise<BookingResponseDto[]> {
    const showing = await this.showingModel
      .findById(showingId)
      .select('bookings')
      .lean<{ _id: Types.ObjectId; bookings: ShowingBooking[] }>();
    if (!showing) throw this.showingsService.notFound(showingId);
    return showing.bookings.map((b) =>
      BookingResponseDto.fromEmbedded(b, showing._id),
    );
  }

  async getSeats(showingId: string): Promise<SeatAvailabilityDto[]> {
    const showing = await this.showingModel
      .findById(showingId)
      .select('seats')
      .lean<{ seats: ShowingSeat[] }>();
    if (!showing) throw this.showingsService.notFound(showingId);
    return showing.seats.map((s) => ({
      row: s.row,
      seat: s.seat,
      isBooked: s.bookingId !== null,
    }));
  }

  /** Звільняє місця й видаляє запис бронювання одним оновленням. */
  async remove(id: string): Promise<void> {
    const bookingId = new Types.ObjectId(id);
    const result = await this.showingModel.updateOne(
      { 'bookings._id': bookingId },
      {
        $set: { 'seats.$[target].bookingId': null },
        $pull: { bookings: { _id: bookingId } },
      },
      { arrayFilters: [{ 'target.bookingId': bookingId }] },
    );
    if (result.matchedCount === 0) {
      throw new NotFoundException(`Booking with id "${id}" not found`);
    }
  }
}
