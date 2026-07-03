import { Module } from '@nestjs/common';
import { StripePaymentsService } from './stripe-payments.service';
import { StripePaymentsController } from './stripe-payments.controller';
import { DepositsModule } from '../deposits/deposits.module';

@Module({
  imports: [DepositsModule],
  controllers: [StripePaymentsController],
  providers: [StripePaymentsService],
})
export class StripeModule {}
