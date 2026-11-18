import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ShowingsService } from '../showings/showings.service';
import { CreateFilmDto } from './dto/create-film.dto';
import { FilmResponseDto } from './dto/film-response.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import { Film } from './schemas/film.schema';

@Injectable()
export class FilmsService {
  constructor(
    @InjectModel(Film.name) private readonly filmModel: Model<Film>,
    @Inject(forwardRef(() => ShowingsService))
    private readonly showingsService: ShowingsService,
  ) {}

  async create(dto: CreateFilmDto): Promise<FilmResponseDto> {
    const film = await this.filmModel.create(dto);
    return FilmResponseDto.fromDocument(film);
  }

  async findAll(): Promise<FilmResponseDto[]> {
    const films = await this.filmModel.find().sort({ _id: 1 }).lean();
    return films.map((f) => FilmResponseDto.fromDocument(f));
  }

  /** Чи існує фільм: для перевірок з інших модулів. */
  async exists(id: string): Promise<boolean> {
    return (await this.filmModel.exists({ _id: id })) !== null;
  }

  async findOne(id: string): Promise<FilmResponseDto> {
    const film = await this.filmModel.findById(id).lean();
    if (!film) throw this.notFound(id);
    return FilmResponseDto.fromDocument(film);
  }

  async update(id: string, dto: UpdateFilmDto): Promise<FilmResponseDto> {
    const film = await this.filmModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true })
      .lean();
    if (!film) throw this.notFound(id);
    return FilmResponseDto.fromDocument(film);
  }

  async remove(id: string): Promise<void> {
    if (!(await this.exists(id))) throw this.notFound(id);
    // У MongoDB немає зовнішніх ключів: залежні сеанси перевіряються запитом.
    if (await this.showingsService.hasShowingsForFilm(id)) {
      throw new ConflictException(
        `Film with id "${id}" cannot be deleted: it is used by at least one showing`,
      );
    }
    await this.filmModel.deleteOne({ _id: id });
  }

  private notFound(id: string) {
    return new NotFoundException(`Film with id "${id}" not found`);
  }
}
