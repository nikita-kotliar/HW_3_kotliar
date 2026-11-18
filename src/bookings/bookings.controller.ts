import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiObjectIdParam } from '../common/api-object-id';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { BookingsService } from './bookings.service';
import {
  BookingResponseDto,
  SeatAvailabilityDto,
} from './dto/booking-response.dto';
import { CreateBookingDto } from './dto/create-booking.dto';

@ApiTags('bookings')
@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('bookings')
  @ApiOkResponse({ type: [BookingResponseDto], description: 'Усі бронювання' })
  findAll(): Promise<BookingResponseDto[]> {
    return this.bookingsService.findAll();
  }

  @Delete('bookings/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiObjectIdParam()
  @ApiNoContentResponse({ description: 'Бронювання скасовано, місця вільні' })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'id не є ObjectId',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Бронювання з таким id немає',
  })
  remove(@Param('id', ParseObjectIdPipe) id: string): Promise<void> {
    return this.bookingsService.remove(id);
  }

  @Post('showings/:id/bookings')
  @ApiObjectIdParam('id', 'ObjectId сеансу')
  @ApiCreatedResponse({
    type: BookingResponseDto,
    description: 'Бронювання створено',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description:
      'seats порожній, елемент без row/seat, місце повторюється або його немає в залі',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Сеансу з таким id немає',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Хоча б одне місце вже заброньоване; нічого не записано',
  })
  create(
    @Param('id', ParseObjectIdPipe) showingId: string,
    @Body() dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.create(showingId, dto);
  }

  @Get('showings/:id/bookings')
  @ApiObjectIdParam('id', 'ObjectId сеансу')
  @ApiOkResponse({
    type: [BookingResponseDto],
    description: 'Бронювання сеансу',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'id не є ObjectId',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Сеансу з таким id немає',
  })
  findByShowing(
    @Param('id', ParseObjectIdPipe) showingId: string,
  ): Promise<BookingResponseDto[]> {
    return this.bookingsService.findByShowing(showingId);
  }

  @Get('showings/:id/seats')
  @ApiObjectIdParam('id', 'ObjectId сеансу')
  @ApiOkResponse({
    type: [SeatAvailabilityDto],
    description: 'Усі місця залу з ознакою зайнятості на сеансі',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'id не є ObjectId',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Сеансу з таким id немає',
  })
  getSeats(
    @Param('id', ParseObjectIdPipe) showingId: string,
  ): Promise<SeatAvailabilityDto[]> {
    return this.bookingsService.getSeats(showingId);
  }
}
