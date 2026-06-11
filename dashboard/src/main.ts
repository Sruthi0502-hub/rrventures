import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
// import dns from 'dns';

async function bootstrap() {

  // dns.setDefaultResultOrder('ipv4first');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.useGlobalPipes(new ValidationPipe({
    transform: true
  }));

  const config = new DocumentBuilder().setTitle('Dashboard API')
    .setDescription('API documentation for the Dashboard application')
    .setVersion('1.0').addBearerAuth().build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('dashboard-management', app, document);
  const port = configService.get<string>('PORT') || '0.0.0.0';
  app.enableCors({
    origin: 'http://127.0.0.1:5500',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  await app.listen(port);

}
bootstrap();
