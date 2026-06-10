import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { PropertiesModule } from './properties/properties.module';
import { AdminsModule } from './admins/admins.module';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';
import { ConfigModule, ConfigService } from '@nestjs/config';


@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true
  }), MongooseModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      // console.log('MONGO_URI =>', configService.get<string>('MONGO_URI'));
      return {
        uri: configService.get<string>('MONGO_URI'),
      };
    }
  }), CommonModule, PropertiesModule, AdminsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
