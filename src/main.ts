import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enforce global validation on every single incoming API request payload
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Automatically strip away properties that shouldn't be in the payload
      transform: true, // Automatically convert payloads to their typed DTO classes
    }),
  );
	app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(3000);
  console.log('🎮 ArenaCraft Core Engine Listening on http://localhost:3000');
}
bootstrap();
