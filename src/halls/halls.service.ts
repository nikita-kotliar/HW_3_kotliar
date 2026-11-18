import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { isDuplicateKeyError } from '../common/db-errors';
import { ShowingsService } from '../showings/showings.service';
import { CreateHallDto } from './dto/create-hall.dto';
import {
  expandHallSeats,
  HallResponseDto,
  HallWithSeatsDto,
  SeatPositionDto,
} from './dto/hall-with-seats.dto';
import { Hall } from './schemas/hall.schema';

export type HallRecord = Hall & { _id: Types.ObjectId };

/** Порівняння назв без урахування регістру (en, strength 2). */
const CASE_INSENSITIVE = { locale: 'en', strength: 2 } as const;

@Injectable()
export class HallsService {
  constructor(
    @InjectModel(Hall.name) private readonly hallModel: Model<Hall>,
    @Inject(forwardRef(() => ShowingsService))
    private readonly showingsService: ShowingsService,
  ) {}

  async create(dto: CreateHallDto): Promise<HallResponseDto> {
    const name = dto.name.trim();
    const duplicate = () =>
      new ConflictException(`Hall with name "${name}" already exists`);

    const taken = await this.hallModel
      .exists({ name })
      .collation(CASE_INSENSITIVE);
    if (taken) throw duplicate();

    try {
      const hall = await this.hallModel.create({ ...dto, name });
      return HallResponseDto.fromDocument(hall);
    } catch (error) {
      // Паралельний запит з тією ж назвою: спрацював унікальний індекс.
      if (isDuplicateKeyError(error)) throw duplicate();
      throw error;
    }
  }

  async findAll(): Promise<HallResponseDto[]> {
    const halls = await this.hallModel.find().sort({ _id: 1 }).lean();
    return halls.map((h) => HallResponseDto.fromDocument(h));
  }

  /** Сирий документ залу або null: для інших модулів. */
  find(id: string | Types.ObjectId): Promise<HallRecord | null> {
    return this.hallModel.findById(id).lean<HallRecord>();
  }

  async findOneWithSeats(id: string): Promise<HallWithSeatsDto> {
    const hall = await this.find(id);
    if (!hall) throw this.notFound(id);
    return {
      ...HallResponseDto.fromDocument(hall),
      seats: expandHallSeats(hall),
    };
  }

  hasSeat(hall: Pick<Hall, 'rows' | 'seatsPerRow'>, s: SeatPositionDto) {
    return (
      s.row >= 1 &&
      s.row <= hall.rows &&
      s.seat >= 1 &&
      s.seat <= hall.seatsPerRow
    );
  }

  async remove(id: string): Promise<void> {
    if (!(await this.hallModel.exists({ _id: id }))) throw this.notFound(id);
    if (await this.showingsService.hasShowingsForHall(id)) {
      throw new ConflictException(
        `Hall with id "${id}" cannot be deleted: it is used by at least one showing`,
      );
    }
    await this.hallModel.deleteOne({ _id: id });
  }

  private notFound(id: string) {
    return new NotFoundException(`Hall with id "${id}" not found`);
  }
}
