export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  RUB = 'RUB',
  KZT = 'KZT',
  UAH = 'UAH',
  TRY = 'TRY',
  AED = 'AED',
  CNY = 'CNY',
  JPY = 'JPY',
  BTC = 'BTC',
  ETH = 'ETH',
  USDT = 'USDT',
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRANSFER = 'transfer',
  EXCHANGE = 'exchange',
  MERCHANT_PAYMENT = 'merchant_payment',
  REFUND = 'refund',
  PLATFORM_FEE = 'platform_fee',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum KycStatus {
  NOT_STARTED = 'not_started',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum UserRole {
  USER = 'user',
  MERCHANT = 'merchant',
  ADMIN = 'admin',
}

export const FIAT_CURRENCIES = [
  Currency.USD, Currency.EUR, Currency.GBP, Currency.RUB,
  Currency.KZT, Currency.UAH, Currency.TRY, Currency.AED,
  Currency.CNY, Currency.JPY,
];

export const CRYPTO_CURRENCIES = [Currency.BTC, Currency.ETH, Currency.USDT];

export const SUPPORTED_CURRENCIES = Object.values(Currency);

export const DEPOSIT_FEE_PERCENT = 3;
export const TRANSFER_FEE_PERCENT = 3;
export const EXCHANGE_FEE_PERCENT = 3;
export const MERCHANT_FEE_PERCENT = 3;

export const CURRENCY_LABELS: Record<string, string> = {
  USD: 'Доллар США',
  EUR: 'Евро',
  GBP: 'Фунт',
  RUB: 'Рубль',
  KZT: 'Тенге',
  UAH: 'Гривна',
  TRY: 'Лира',
  AED: 'Дирхам',
  CNY: 'Юань',
  JPY: 'Йена',
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  USDT: 'Tether USDT',
};

export function calcFee(amount: number, percent: number) {
  return amount * (percent / 100);
}

export function calcNetAfterFee(amount: number, percent: number) {
  const fee = calcFee(amount, percent);
  return { fee, net: amount - fee };
}
