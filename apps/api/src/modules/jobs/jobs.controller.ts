import { RequirePermissions } from '@/common/decorators/rbac.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { PERMISSIONS } from '@careerslk/lib';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FilterJobsDto } from './dto/filters.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';

@Controller('jobs')
@UseGuards(PermissionsGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.JOBS_READ)
  findAll(@Query() filters: FilterJobsDto) {
    return this.jobsService.findAll(filters);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.JOBS_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.JOBS_READ)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateJobDto: UpdateJobDto,
  ) {
    return this.jobsService.update(id, updateJobDto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.JOBS_READ)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.softDelete(id);
  }
}
