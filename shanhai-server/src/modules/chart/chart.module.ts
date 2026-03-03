import { Module } from '@nestjs/common';
import { ChartService } from './chart.service';
import { ChartController } from './chart.controller';
import { UserService } from '../user/user.service';

@Module({
  controllers: [ChartController],
  providers: [ChartService, UserService],
  exports: [ChartService, UserService],
})
export class ChartModule {}
