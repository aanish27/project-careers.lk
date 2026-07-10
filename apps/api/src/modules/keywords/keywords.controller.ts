import { PaginationDto } from '@/common/dto/pagination.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AssignJobKeywordDto } from './dto/assign-job-keyword.dto';
import { CreateKeywordDto } from './dto/create-keyword.dto';
import { UpdateJobKeywordDto } from './dto/update-job-keyword.dto';
import { UpdateKeywordDto } from './dto/update-keyword.dto';
import { KeywordsService } from './keywords.service';

@Controller('keywords')
export class KeywordsController {
  constructor(private readonly keywordsService: KeywordsService) {}

  @Post()
  create(@Body() createKeywordDto: CreateKeywordDto) {
    return this.keywordsService.create(createKeywordDto);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.keywordsService.findAll(pagination.page, pagination.limit);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.keywordsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateKeywordDto: UpdateKeywordDto,
  ) {
    return this.keywordsService.update(id, updateKeywordDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.keywordsService.remove(id);
  }

  @Post('jobs/:jobId')
  assignToJob(
    @Param('jobId', ParseIntPipe) jobId: number,
    @Body() assignJobKeywordDto: AssignJobKeywordDto,
  ) {
    return this.keywordsService.assignToJob(jobId, assignJobKeywordDto);
  }

  @Patch('jobs/:jobId/:keywordId')
  updateJobKeyword(
    @Param('jobId', ParseIntPipe) jobId: number,
    @Param('keywordId', ParseIntPipe) keywordId: number,
    @Body() updateJobKeywordDto: UpdateJobKeywordDto,
  ) {
    return this.keywordsService.updateJobKeyword(
      jobId,
      keywordId,
      updateJobKeywordDto,
    );
  }

  @Delete('jobs/:jobId/:keywordId')
  removeJobKeyword(
    @Param('jobId', ParseIntPipe) jobId: number,
    @Param('keywordId', ParseIntPipe) keywordId: number,
  ) {
    return this.keywordsService.removeJobKeyword(jobId, keywordId);
  }
}
