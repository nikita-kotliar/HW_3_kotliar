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
import { CreateHallDto } from './dto/create-hall.dto';
import { HallResponseDto, HallWithSeatsDto } from './dto/hall-with-seats.dto';
import { HallsService } from './halls.service';

@ApiTags('halls')
@Controller('halls')
export class HallsController {
  constructor(private readonly hallsService: HallsService) {}

  @Post()
  @ApiCreatedResponse({ type: HallResponseDto, description: 'Зал створено' })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Поле відсутнє, має неправильний тип або не є цілим додатним',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Зал з такою назвою вже існує',
  })
  create(@Body() dto: CreateHallDto): Promise<HallResponseDto> {
    return this.hallsService.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: [HallResponseDto], description: 'Масив усіх залів' })
  findAll(): Promise<HallResponseDto[]> {
    return this.hallsService.findAll();
  }

  @Get(':id')
  @ApiObjectIdParam()
  @ApiOkResponse({
    type: HallWithSeatsDto,
    description: 'Зал з переліком місць',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'id не є ObjectId',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Залу з таким id немає',
  })
  findOne(
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<HallWithSeatsDto> {
    return this.hallsService.findOneWithSeats(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiObjectIdParam()
  @ApiNoContentResponse({ description: 'Зал видалено' })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'id не є ObjectId',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Залу з таким id немає',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'На зал посилається хоча б один сеанс',
  })
  remove(@Param('id', ParseObjectIdPipe) id: string): Promise<void> {
    return this.hallsService.remove(id);
  }
}
