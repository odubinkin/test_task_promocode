import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getTypeOrmConfig } from './database/typeorm.config';
import { PromocodesModule } from './promocodes/promocodes.module';

@Module({
  imports: [TypeOrmModule.forRoot(getTypeOrmConfig()), PromocodesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
