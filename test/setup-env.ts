// e2e-тести працюють з окремою базою, щоб не чіпати дані розробки.
// Змінні з process.env мають пріоритет над .env у ConfigModule.
process.env.MONGODB_URI =
  process.env.TEST_MONGODB_URI ?? 'mongodb://localhost:27018/cinema_test';
