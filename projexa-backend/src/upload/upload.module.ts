import { Module } from '@nestjs/common';
import { UploadController } from './upload.contoller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [UploadController],
})
export class UploadModule {}