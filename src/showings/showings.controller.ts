import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiObjectIdParam } from '../common/api-object-id';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { CreateShowingDto } from './dto/create-showing.dto';
import {
  ShowingResponseDto,
  ShowingsPageDto,
  ShowingViewDto,
} from './dto/showing-view.dto';
import { ShowingsQueryDto } from './dto/showings-query.dto';
import { ShowingsService } from './showings.service';

@ApiTags('showings')
@Controller('showings')
export class ShowingsController {
  constructor(private readonly showingsService: ShowingsService) {}

  @Post()
  @ApiCreatedResponse({
    type: ShowingResponseDto,
    description: 'Сеанс створено; seats заповнено за схемою залу',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description:
      'filmId/hallId не ObjectId або запису немає; startsAt некоректна або в минулому; price не ціле додатне',
  })
  create(@Body() dto: CreateShowingDto): Promise<ShowingResponseDto> {
    return this.showingsService.create(dto);
  }

  @Get()
  @ApiOkResponse({
    type: ShowingsPageDto,
    description:
      'Сторінка сеансів, відсортованих за часом початку, при рівності за _id',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description:
      'page/limit не ціле число або поза межами; date не YYYY-MM-DD; sort не asc/desc; filmId не ObjectId',
  })
  findAll(@Query() query: ShowingsQueryDto): Promise<ShowingsPageDto> {
    return this.showingsService.findPage(query);
  }

  @Get(':id')
  @ApiObjectIdParam()
  @ApiOkResponse({ type: ShowingViewDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'id не є ObjectId',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Сеансу з таким id немає',
  })
  findOne(@Param('id', ParseObjectIdPipe) id: string): Promise<ShowingViewDto> {
    return this.showingsService.findOneView(id);
  }
}
