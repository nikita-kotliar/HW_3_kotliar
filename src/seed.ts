import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppModule } from './app.module';
import { Film } from './films/schemas/film.schema';
import { expandHallSeats } from './halls/dto/hall-with-seats.dto';
import { Hall } from './halls/schemas/hall.schema';
import { Showing } from './showings/schemas/showing.schema';

/**
 * Заповнює базу тестовими даними. Запуск: npm run seed.
 * Документи мають фіксовані _id і вставляються через upsert з $setOnInsert,
 * тож повторний запуск нічого не дублює й не перезаписує зроблені бронювання.
 */

const id = (hex: string) => new Types.ObjectId(hex);

const films = [
  {
    _id: id('6650000000000000000000f1'),
    title: 'Dune: Part Two',
    durationMinutes: 166,
    releaseYear: 2024,
  },
  {
    _id: id('6650000000000000000000f2'),
    title: 'Interstellar',
    durationMinutes: 169,
    releaseYear: 2014,
  },
];

const halls = [
  {
    _id: id('6650000000000000000000a1'),
    name: 'Seed: Великий зал',
    rows: 8,
    seatsPerRow: 12,
  },
  {
    _id: id('6650000000000000000000a2'),
    name: 'Seed: Малий зал',
    rows: 3,
    seatsPerRow: 5,
  },
];

const showingsPlan = [
  {
    _id: id('665000000000000000000051'),
    film: 0,
    hall: 0,
    startsAt: '2030-05-01T18:30:00Z',
    price: 15000,
  },
  {
    _id: id('665000000000000000000052'),
    film: 0,
    hall: 1,
    startsAt: '2030-05-02T10:00:00Z',
    price: 9000,
  },
  {
    _id: id('665000000000000000000053'),
    film: 1,
    hall: 0,
    startsAt: '2030-05-03T20:00:00Z',
    price: 14000,
  },
  {
    _id: id('665000000000000000000054'),
    film: 1,
    hall: 1,
    startsAt: '2030-05-04T15:15:00Z',
    price: 11000,
  },
];

/** Одне бронювання на першому сеансі: ряд 5, місця 6 і 7. */
const booking = {
  _id: id('6650000000000000000000b1'),
  seats: [
    { row: 5, seat: 6 },
    { row: 5, seat: 7 },
  ],
};

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const filmModel = app.get<Model<Film>>(getModelToken(Film.name));
    const hallModel = app.get<Model<Hall>>(getModelToken(Hall.name));
    const showingModel = app.get<Model<Showing>>(getModelToken(Showing.name));

    await hallModel.syncIndexes();

    const upsert = <T>(model: Model<T>, docs: { _id: Types.ObjectId }[]) =>
      model.bulkWrite(
        docs.map((doc) => ({
          updateOne: {
            filter: { _id: doc._id },
            update: { $setOnInsert: doc },
            upsert: true,
          },
        })) as Parameters<Model<T>['bulkWrite']>[0],
      );

    await upsert(filmModel, films);
    await upsert(hallModel, halls);

    const showings = showingsPlan.map((plan, index) => {
      const hall = halls[plan.hall];
      const isBooked = (row: number, seat: number) =>
        index === 0 &&
        booking.seats.some((s) => s.row === row && s.seat === seat);
      return {
        _id: plan._id,
        film: films[plan.film]._id,
        hall: hall._id,
        startsAt: new Date(plan.startsAt),
        price: plan.price,
        seats: expandHallSeats(hall).map((s) => ({
          ...s,
          bookingId: isBooked(s.row, s.seat) ? booking._id : null,
        })),
        bookings:
          index === 0
            ? [
                {
                  _id: booking._id,
                  seats: booking.seats,
                  totalPrice: plan.price * booking.seats.length,
                  createdAt: new Date('2030-04-01T12:00:00Z'),
                },
              ]
            : [],
      };
    });
    await upsert(showingModel, showings);

    const [f, h, s] = await Promise.all([
      filmModel.countDocuments(),
      hallModel.countDocuments(),
      showingModel.countDocuments(),
    ]);
    const [{ total = 0 } = {}] = await showingModel.aggregate<{
      total: number;
    }>([
      { $project: { n: { $size: '$bookings' } } },
      { $group: { _id: null, total: { $sum: '$n' } } },
    ]);
    console.log(
      `Seed done. films=${f} halls=${h} showings=${s} bookings=${total}`,
    );
  } finally {
    await app.close();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
