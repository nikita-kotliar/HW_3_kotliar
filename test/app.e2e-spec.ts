import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

const missingId = '665f1c2b9a1e4b3c2d1f0a9e';

describe('Cinema API with MongoDB (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;
  let connection: Connection;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    http = request(app.getHttpServer());
    connection = app.get<Connection>(getConnectionToken());
    await Promise.all(
      Object.values(connection.models).map((m) => m.syncIndexes()),
    );
  });

  beforeEach(async () => {
    await Promise.all(
      Object.values(connection.collections).map((c) => c.deleteMany({})),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  async function seed() {
    const film = await http
      .post('/films')
      .send({ title: 'Dune', durationMinutes: 166, releaseYear: 2024 })
      .expect(201);
    const hall = await http
      .post('/halls')
      .send({ name: 'Hall 1', rows: 3, seatsPerRow: 5 })
      .expect(201);
    const showing = await http
      .post('/showings')
      .send({
        filmId: film.body.id,
        hallId: hall.body.id,
        startsAt: '2030-05-01T18:30:00Z',
        price: 12500,
      })
      .expect(201);
    return {
      filmId: film.body.id as string,
      hallId: hall.body.id as string,
      showingId: showing.body.id as string,
    };
  }

  it('films CRUD with string id, unified errors', async () => {
    const { body } = await http
      .post('/films')
      .send({ title: 'A', durationMinutes: 90, releaseYear: 2020, extra: 1 })
      .expect(201);
    expect(body).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{24}$/),
      title: 'A',
      durationMinutes: 90,
      releaseYear: 2020,
    });
    expect(body._id).toBeUndefined();
    await http.get('/films').expect(200, [body]);
    await http.get(`/films/${body.id}`).expect(200, body);
    await http
      .patch(`/films/${body.id}`)
      .send({ title: 'B' })
      .expect(200)
      .expect((r) => expect(r.body.title).toBe('B'));
    await http
      .patch(`/films/${body.id}`)
      .send({ releaseYear: 'x' })
      .expect(400);
    await http.patch(`/films/${missingId}`).send({ title: 'C' }).expect(404);
    await http.delete(`/films/${body.id}`).expect(204, '');

    const notFound = await http.get(`/films/${body.id}`).expect(404);
    expect(notFound.body).toMatchObject({
      statusCode: 404,
      path: `/films/${body.id}`,
    });
    const badId = await http.get('/films/123').expect(400);
    expect(badId.body.message).toContain('ObjectId');
    await http.delete('/films/zzz').expect(400);
  });

  it('halls: seats list and unique name', async () => {
    const { body } = await http
      .post('/halls')
      .send({ name: 'Big', rows: 3, seatsPerRow: 5 })
      .expect(201);
    const hall = await http.get(`/halls/${body.id}`).expect(200);
    expect(hall.body.seats).toHaveLength(15);
    expect(hall.body.id).toBe(body.id);
    await http
      .post('/halls')
      .send({ name: 'Big', rows: 1, seatsPerRow: 1 })
      .expect(409);
    await http
      .post('/halls')
      .send({ name: 'BIG', rows: 1, seatsPerRow: 1 })
      .expect(409);
    await http
      .post('/halls')
      .send({ name: 'X', rows: 0, seatsPerRow: 1 })
      .expect(400);
    await http.get(`/halls/${missingId}`).expect(404);
    await http.get('/halls/nope').expect(400);
  });

  it('forbids deleting film and hall used by a showing', async () => {
    const { filmId, hallId } = await seed();
    await http.delete(`/films/${filmId}`).expect(409);
    await http.delete(`/halls/${hallId}`).expect(409);
  });

  it('showings: create fills seats, response has no arrays', async () => {
    const { filmId, hallId, showingId } = await seed();
    const raw = await connection
      .collection('showings')
      .findOne({}, { projection: { seats: 1, bookings: 1 } });
    expect(raw!.seats).toHaveLength(15);
    expect(
      raw!.seats.every((s: { bookingId: unknown }) => s.bookingId === null),
    ).toBe(true);
    expect(raw!.bookings).toEqual([]);

    const one = await http.get(`/showings/${showingId}`).expect(200);
    expect(one.body).toEqual({
      id: showingId,
      filmTitle: 'Dune',
      hallName: 'Hall 1',
      startsAt: '2030-05-01T18:30:00.000Z',
      price: 12500,
    });

    const base = { filmId, hallId, startsAt: '2030-01-01T10:00:00Z', price: 1 };
    const r = await http
      .post('/showings')
      .send({ ...base, filmId: missingId })
      .expect(400);
    expect(r.body.message).toContain('Film');
    await http
      .post('/showings')
      .send({ ...base, hallId: missingId })
      .expect(400);
    await http
      .post('/showings')
      .send({ ...base, filmId: 'abc' })
      .expect(400);
    await http
      .post('/showings')
      .send({ ...base, startsAt: 'nope' })
      .expect(400);
    await http
      .post('/showings')
      .send({ ...base, startsAt: '2000-01-01T10:00:00Z' })
      .expect(400);
    await http
      .post('/showings')
      .send({ ...base, price: 0 })
      .expect(400);
    await http.get(`/showings/${missingId}`).expect(404);
    await http.get('/showings/xyz').expect(400);
  });

  it('showings: pagination, filters and sorting in DB', async () => {
    const { filmId, hallId } = await seed();
    const other = await http
      .post('/films')
      .send({ title: 'Other', durationMinutes: 100, releaseYear: 2021 })
      .expect(201);
    const create = (fId: string, startsAt: string) =>
      http
        .post('/showings')
        .send({ filmId: fId, hallId, startsAt, price: 100 })
        .expect(201);
    await create(filmId, '2030-05-01T09:00:00Z');
    await create(filmId, '2030-05-02T09:00:00Z');
    await create(other.body.id, '2030-05-01T12:00:00Z');
    await create(other.body.id, '2030-05-01T12:00:00Z');

    const all = await http.get('/showings').expect(200);
    expect(all.body).toMatchObject({ total: 5, page: 1, limit: 20 });
    expect(all.body.items[0].seats).toBeUndefined();
    const times = all.body.items.map((s: { startsAt: string }) => s.startsAt);
    expect(times).toEqual([...times].sort());
    const tied = all.body.items.filter(
      (s: { startsAt: string }) => s.startsAt === '2030-05-01T12:00:00.000Z',
    );
    expect(tied[0].id < tied[1].id).toBe(true);

    const desc = await http.get('/showings?sort=desc&limit=2').expect(200);
    expect(desc.body.items[0].startsAt).toBe('2030-05-02T09:00:00.000Z');
    expect(desc.body.total).toBe(5);

    const page2 = await http.get('/showings?limit=2&page=2').expect(200);
    expect(page2.body.items.map((s: { id: string }) => s.id)).toEqual(
      all.body.items.slice(2, 4).map((s: { id: string }) => s.id),
    );

    const filtered = await http
      .get(`/showings?filmId=${filmId}&date=2030-05-01`)
      .expect(200);
    expect(filtered.body.total).toBe(2);
    expect(filtered.body.items[0]).toMatchObject({
      filmTitle: 'Dune',
      hallName: 'Hall 1',
    });

    for (const q of [
      'page=0',
      'page=1.5',
      'limit=0',
      'limit=101',
      'sort=up',
      'date=2030-5-1',
      'filmId=123',
    ]) {
      await http.get(`/showings?${q}`).expect(400);
    }
  });

  it('bookings: single update, conflict, validation, cancel', async () => {
    const { showingId } = await seed();
    const url = `/showings/${showingId}/bookings`;
    const pair = {
      seats: [
        { row: 1, seat: 3 },
        { row: 1, seat: 4 },
      ],
    };

    const booking = await http.post(url).send(pair).expect(201);
    expect(booking.body).toMatchObject({
      id: expect.stringMatching(/^[0-9a-f]{24}$/),
      showingId,
      totalPrice: 25000,
      seats: pair.seats,
    });

    await http.post(url).send({ seats: [] }).expect(400);
    await http
      .post(url)
      .send({ seats: [{ row: 1 }] })
      .expect(400);
    await http
      .post(url)
      .send({
        seats: [
          { row: 2, seat: 2 },
          { row: 2, seat: 2 },
        ],
      })
      .expect(400);
    await http
      .post(url)
      .send({ seats: [{ row: 4, seat: 1 }] })
      .expect(400);
    await http
      .post(url)
      .send({ seats: [{ row: 1, seat: 6 }] })
      .expect(400);
    await http
      .post(url)
      .send({ seats: [{ row: 0, seat: 1 }] })
      .expect(400);
    await http
      .post(`/showings/${missingId}/bookings`)
      .send({ seats: [{ row: 1, seat: 1 }] })
      .expect(404);
    await http.post('/showings/bad/bookings').send(pair).expect(400);

    await http
      .post(url)
      .send({
        seats: [
          { row: 2, seat: 1 },
          { row: 1, seat: 4 },
        ],
      })
      .expect(409);

    const seats = await http.get(`/showings/${showingId}/seats`).expect(200);
    expect(seats.body).toHaveLength(15);
    expect(
      seats.body
        .filter((s: { isBooked: boolean }) => s.isBooked)
        .map((s: { row: number; seat: number }) => `${s.row}:${s.seat}`),
    ).toEqual(['1:3', '1:4']);

    await http.get(url).expect((r) => expect(r.body).toHaveLength(1));
    await http.get('/bookings').expect((r) => expect(r.body).toHaveLength(1));
    await http.get(`/showings/${missingId}/seats`).expect(404);
    await http.get(`/showings/${missingId}/bookings`).expect(404);

    await http.delete(`/bookings/${booking.body.id}`).expect(204);
    await http.delete(`/bookings/${booking.body.id}`).expect(404);
    await http.delete('/bookings/bad').expect(400);
    await http.get(url).expect((r) => expect(r.body).toEqual([]));
    const freed = await http.get(`/showings/${showingId}/seats`).expect(200);
    expect(freed.body.some((s: { isBooked: boolean }) => s.isBooked)).toBe(
      false,
    );

    await http.post(url).send(pair).expect(201);
  });

  it('concurrent bookings of the same seat: exactly one succeeds', async () => {
    const { showingId } = await seed();
    const url = `/showings/${showingId}/bookings`;
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app.getHttpServer())
          .post(url)
          .send({ seats: [{ row: 3, seat: 3 }] }),
      ),
    );
    expect(results.map((r) => r.status).sort()).toEqual([
      201, 409, 409, 409, 409,
    ]);
    const list = await http.get(`/showings/${showingId}/bookings`).expect(200);
    expect(list.body).toHaveLength(1);
  });
});
