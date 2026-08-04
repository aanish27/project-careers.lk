import { StorageModule } from '@/shared/storage/storage.module';
import { Module } from '@nestjs/common';
import { PublicGigsController } from './public-gigs.controller';
import { PublicGigsService } from './public-gigs.service';

@Module({
  imports: [StorageModule],
  controllers: [PublicGigsController],
  providers: [PublicGigsService],
})
export class PublicGigsModule {}
