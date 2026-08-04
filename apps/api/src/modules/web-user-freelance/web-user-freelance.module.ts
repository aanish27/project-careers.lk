import { StorageModule } from '@/shared/storage/storage.module';
import { Module } from '@nestjs/common';
import { WebUserFreelanceProfilesController } from './web-user-freelance-profiles.controller';
import { WebUserFreelanceProfilesService } from './web-user-freelance-profiles.service';
import { WebUserGigsController } from './web-user-gigs.controller';
import { WebUserGigsService } from './web-user-gigs.service';

@Module({
  imports: [StorageModule],
  controllers: [WebUserFreelanceProfilesController, WebUserGigsController],
  providers: [WebUserFreelanceProfilesService, WebUserGigsService],
})
export class WebUserFreelanceModule {}
