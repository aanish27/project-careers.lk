import { StorageModule } from '@/shared/storage/storage.module';
import { Module } from '@nestjs/common';
import { PublicFreelanceProfilesController } from './public-freelance-profiles.controller';
import { PublicFreelanceProfilesService } from './public-freelance-profiles.service';

@Module({
  imports: [StorageModule],
  controllers: [PublicFreelanceProfilesController],
  providers: [PublicFreelanceProfilesService],
})
export class PublicFreelanceProfilesModule {}
