import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery, Types } from 'mongoose';
import { FilmsService } from '../films/films.service';
import { expandHallSeats } from '../halls/dto/hall-with-seats.dto';
import { HallsService } from '../halls/halls.service';
import { CreateShowingDto } from './dto/create-showing.dto';
import {
  ShowingResponseDto,
  ShowingsPageDto,
  ShowingViewDto,
} from './dto/showing-view.dto';
import { ShowingsQueryDto } from './dto/showings-query.dto';
import { Showing } from './schemas/showing.schema';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Поля сеансу без вкладених масивів: для відповідей. */
const PUBLIC_FIELDS = '-seats -bookings';

type PopulatedShowing = {
  _id: Types.ObjectId;
  startsAt: Date;
  price: number;
  film: { title: string };
  hall: { name: string };
};

@Injectable()
export class ShowingsService {
  constructor(
    @InjectModel(Showing.name) private readonly showingModel: Model<Showing>,
    @Inject(forwardRef(() => FilmsService))
    private readonly filmsService: FilmsService,
    @Inject(forwardRef(() => HallsService))
    private readonly hallsService: HallsService,
  ) {}

  async create(dto: CreateShowingDto): Promise<ShowingResponseDto> {
    if (!(await this.filmsService.exists(dto.filmId))) {
      throw new BadRequestException(`Film with id "${dto.filmId}" not found`);
    }
    const hall = await this.hallsService.find(dto.hallId);
    if (!hall) {
      throw new BadRequestException(`Hall with id "${dto.hallId}" not found`);
    }
    const startsAt = new Date(dto.startsAt);
    if (startsAt.getTime() < Date.now()) {
      throw new BadRequestException('startsAt must not be in the past');
    }

    // Масив seats розгортається зі схеми залу в момент створення сеансу.
    const showing = await this.showingModel.create({
      film: new Types.ObjectId(dto.filmId),
      hall: hall._id,
      startsAt,
      price: dto.price,
      seats: expandHallSeats(hall).map((s) => ({ ...s, bookingId: null })),
      bookings: [],
    });
    return ShowingResponseDto.fromDocument(showing);
  }

  /** Фільтрація, сортування, skip/limit і підрахунок виконуються запитами до БД. */
  async findPage(query: ShowingsQueryDto): Promise<ShowingsPageDto> {
    const { filmId, date, page, limit, sort } = query;

    const filter: RootFilterQuery<Showing> = {};
    if (filmId) filter.film = new Types.ObjectId(filmId);
    if (date) {
      const from = new Date(`${date}T00:00:00.000Z`);
      filter.startsAt = { $gte: from, $lt: new Date(from.getTime() + DAY_MS) };
    }

    const direction = sort === 'desc' ? -1 : 1;
    const [rows, total] = await Promise.all([
      this.showingModel
        .find(filter)
        .select(PUBLIC_FIELDS)
        .sort({ startsAt: direction, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('film', 'title')
        .populate('hall', 'name')
        .lean<PopulatedShowing[]>(),
      this.showingModel.countDocuments(filter),
    ]);

    return {
      items: rows.map((s) => ShowingViewDto.fromPopulated(s)),
      total,
      page,
      limit,
    };
  }

  async findOneView(id: string): Promise<ShowingViewDto> {
    const showing = await this.showingModel
      .findById(id)
      .select(PUBLIC_FIELDS)
      .populate('film', 'title')
      .populate('hall', 'name')
      .lean<PopulatedShowing>();
    if (!showing) throw this.notFound(id);
    return ShowingViewDto.fromPopulated(showing);
  }

  async hasShowingsForFilm(filmId: string): Promise<boolean> {
    return (await this.showingModel.exists({ film: filmId })) !== null;
  }

  async hasShowingsForHall(hallId: string): Promise<boolean> {
    return (await this.showingModel.exists({ hall: hallId })) !== null;
  }

  notFound(id: string) {
    return new NotFoundException(`Showing with id "${id}" not found`);
  }
}
