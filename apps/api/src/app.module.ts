import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletsModule } from './wallets/wallets.module';
import { ExchangeModule } from './exchange/exchange.module';
import { TransfersModule } from './transfers/transfers.module';
import { MerchantsModule } from './merchants/merchants.module';
import { PaymentsModule } from './payments/payments.module';
import { DepositsModule } from './deposits/deposits.module';
import { CaptchaModule } from './captcha/captcha.module';
import { AdminModule } from './admin/admin.module';
import { BanksModule } from './banks/banks.module';
import { StripeModule } from './stripe/stripe.module';
import { TransactionsModule } from './transactions/transactions.module';
import { PlatformModule } from './platform/platform.module';
import { EmailModule } from './email/email.module';
import { VerificationModule } from './verification/verification.module';
import { SupportModule } from './support/support.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    DatabaseModule,
    EmailModule,
    CaptchaModule,
    PlatformModule,
    AuthModule,
    UsersModule,
    WalletsModule,
    ExchangeModule,
    TransfersModule,
    MerchantsModule,
    PaymentsModule,
    DepositsModule,
    TransactionsModule,
    VerificationModule,
    SupportModule,
    AdminModule,
    BanksModule,
    StripeModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
