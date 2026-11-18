# Cinema API: домашнє завдання 3

Серверна частина кінотеатру на NestJS + MongoDB ї

## Запуск

```bash
npm install

cp .env.example .env

docker compose up -d

npm run seed

npm run start:dev
```

Після запуску:

- API: http://localhost:3000
- Swagger: http://localhost:3000/docs

### Приклад `.env`

```env
# Порт HTTP-сервера
PORT=3000

# Підключення до MongoDB
MONGODB_URI=mongodb://localhost:27018/cinema
```

## Модель даних

- `films`: `title`, `durationMinutes`, `releaseYear`
- `halls`: `name` (унікальний), `rows`, `seatsPerRow`
- `showings`: `film`, `hall`, `startsAt`, `price`, `seats[]`, `bookings[]`


## Перевірка

Файл [`requests.http`](requests.http)

Автотести:

```bash
npm run test:e2e
```
