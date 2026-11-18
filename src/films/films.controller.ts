import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { CreateFilmDto } from './dto/create-film.dto';
import { FilmResponseDto } from './dto/film-response.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import { FilmsService } from './films.service';

@ApiTags('films')
@Controller('films')
export class FilmsController {
  constructor(private readonly filmsService: FilmsService) {}

  @Post()
  @ApiCreatedResponse({ type: FilmResponseDto, description: 'Фільм створено' })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Поле відсутнє або має неправильний тип',
  })
  create(@Body() dto: CreateFilmDto): Promise<FilmResponseDto> {
    return this.filmsService.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: [FilmResponseDto], description: 'Масив усіх фільмів' })
  findAll(): Promise<FilmResponseDto[]> {
    return this.filmsService.findAll();
  }

  @Get(':id')
  @ApiObjectIdParam()
  @ApiOkResponse({ type: FilmResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'id не є ObjectId',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Фільму з таким id немає',
  })
  findOne(
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<FilmResponseDto> {
    return this.filmsService.findOne(id);
  }

  @Patch(':id')
  @ApiObjectIdParam()
  @ApiOkResponse({ type: FilmResponseDto, description: 'Оновлений фільм' })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Неправильний тип поля або id не є ObjectId',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Фільму з таким id немає',
  })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateFilmDto,
  ): Promise<FilmResponseDto> {
    return this.filmsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiObjectIdParam()
  @ApiNoContentResponse({ description: 'Фільм видалено' })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'id не є ObjectId',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Фільму з таким id немає',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'На фільм посилається хоча б один сеанс',
  })
  remove(@Param('id', ParseObjectIdPipe) id: string): Promise<void> {
    return this.filmsService.remove(id);
  }
}
