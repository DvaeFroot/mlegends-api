import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['x-rapidapi-proxy-secret', 'x-api', 'Content-Type'],
  });

  app.use(json({ limit: '10mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Mobile Legends API')
    .setDescription('Champion, item, and scrape history data for Mobile Legends Bang Bang')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'x-rapidapi-proxy-secret', in: 'header' }, 'x-rapidapi-proxy-secret')
    .addApiKey({ type: 'apiKey', name: 'x-api', in: 'header' }, 'x-api')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
