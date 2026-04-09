import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreatePromocodeDto } from './dto/create-promocode.dto';
import { GetPromocodeParamsDto } from './dto/get-promocode-params.dto';
import { GetPromocodesQueryDto } from './dto/get-promocodes-query.dto';
import {
  PromocodeResponse,
  toPromocodeResponse,
} from './promocode-response.type';
import { PromocodesService } from './promocodes.service';

@Controller('api/v1/promocodes')
/**
 * Exposes REST endpoints for promocode management.
 */
export class PromocodesController {
  constructor(private readonly promocodesService: PromocodesService) {}

  /**
   * Creates a new promocode.
   */
  @Post()
  async create(@Body() dto: CreatePromocodeDto): Promise<PromocodeResponse> {
    const promocode = await this.promocodesService.create(dto);

    return toPromocodeResponse(promocode);
  }

  /**
   * Returns a promocode by code.
   */
  @Get(':code')
  async getByCode(
    @Param() params: GetPromocodeParamsDto,
  ): Promise<PromocodeResponse> {
    const promocode = await this.promocodesService.getByCode(params.code);

    return toPromocodeResponse(promocode);
  }

  /**
   * Returns a list of promocodes with pagination and sorting.
   */
  @Get()
  async list(@Query() query: GetPromocodesQueryDto): Promise<PromocodeResponse[]> {
    const promocodes = await this.promocodesService.list(query);

    return promocodes.map(toPromocodeResponse);
  }
}
