import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ActivatePromocodeDto } from './dto/activate-promocode.dto';
import { ApiErrorResponseDto } from './dto/api-error-response.dto';
import { CreatePromocodeDto } from './dto/create-promocode.dto';
import { GetPromocodeParamsDto } from './dto/get-promocode-params.dto';
import { GetPromocodesQueryDto } from './dto/get-promocodes-query.dto';
import { PromocodeResponseDto } from './dto/promocode-response.dto';
import {
  PromocodeResponse,
  toPromocodeResponse,
} from './promocode-response.type';
import { PromocodesService } from './promocodes.service';

@Controller('api/v1/promocodes')
@ApiTags('promocodes')
/**
 * Exposes REST endpoints for promocode management.
 */
export class PromocodesController {
  constructor(private readonly promocodesService: PromocodesService) {}

  /**
   * Creates a new promocode.
   */
  @ApiOperation({ summary: 'Create a promocode' })
  @ApiCreatedResponse({
    description: 'Promocode successfully created',
    type: PromocodeResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Request validation failed',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Promocode with the same code already exists',
    type: ApiErrorResponseDto,
  })
  @Post()
  async create(@Body() dto: CreatePromocodeDto): Promise<PromocodeResponse> {
    const promocode = await this.promocodesService.create(dto);

    return toPromocodeResponse(promocode);
  }

  /**
   * Returns a promocode by code.
   */
  @ApiOperation({ summary: 'Get promocode by code' })
  @ApiParam({
    name: 'code',
    description: 'Promocode identifier',
    schema: {
      type: 'string',
      minLength: 1,
      maxLength: 15,
    },
    example: 'SPRING24',
  })
  @ApiOkResponse({
    description: 'Promocode found',
    type: PromocodeResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Request validation failed',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Promocode not found',
    type: ApiErrorResponseDto,
  })
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
  @ApiOperation({ summary: 'List promocodes' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    minimum: 0,
    maximum: 1000,
    description: 'Number of records to return',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    minimum: 0,
    description: 'Number of records to skip',
    example: 0,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: [
      'createdAt',
      'updatedAt',
      'validUntil',
      'discount',
      'activationLimit',
    ],
    description: 'Field used for sorting',
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order direction',
    example: 'desc',
  })
  @ApiOkResponse({
    description: 'Promocodes list',
    type: PromocodeResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters',
    type: ApiErrorResponseDto,
  })
  @Get()
  async list(
    @Query() query: GetPromocodesQueryDto,
  ): Promise<PromocodeResponse[]> {
    const promocodes = await this.promocodesService.list(query);

    return promocodes.map(toPromocodeResponse);
  }

  /**
   * Activates promocode for the provided email.
   */
  @ApiOperation({ summary: 'Activate promocode for email' })
  @ApiParam({
    name: 'code',
    description: 'Promocode identifier',
    schema: {
      type: 'string',
      minLength: 1,
      maxLength: 15,
    },
    example: 'SPRING24',
  })
  @ApiNoContentResponse({
    description: 'Promocode activated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body or promocode is not valid',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Promocode is already activated for this email',
    type: ApiErrorResponseDto,
  })
  @Post(':code/activate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async activate(
    @Param() params: GetPromocodeParamsDto,
    @Body() dto: ActivatePromocodeDto,
  ): Promise<void> {
    await this.promocodesService.activate(params.code, dto.email);
  }
}
