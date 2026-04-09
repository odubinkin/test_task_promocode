import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promocode } from '../entities/promocode.entity';
import { PromocodesController } from './promocodes.controller';
import { PromocodesService } from './promocodes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Promocode])],
  controllers: [PromocodesController],
  providers: [PromocodesService],
})
export class PromocodesModule {}
