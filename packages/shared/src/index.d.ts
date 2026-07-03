export declare enum Currency {
    USD = "USD",
    EUR = "EUR",
    GBP = "GBP",
    RUB = "RUB",
    KZT = "KZT",
    UAH = "UAH",
    TRY = "TRY",
    AED = "AED",
    CNY = "CNY",
    JPY = "JPY",
    BTC = "BTC",
    ETH = "ETH",
    USDT = "USDT"
}
export declare enum TransactionType {
    DEPOSIT = "deposit",
    WITHDRAWAL = "withdrawal",
    TRANSFER = "transfer",
    EXCHANGE = "exchange",
    MERCHANT_PAYMENT = "merchant_payment",
    REFUND = "refund",
    PLATFORM_FEE = "platform_fee"
}
export declare enum TransactionStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare enum KycStatus {
    NOT_STARTED = "not_started",
    PENDING = "pending",
    VERIFIED = "verified",
    REJECTED = "rejected"
}
export declare enum UserRole {
    USER = "user",
    MERCHANT = "merchant",
    ADMIN = "admin"
}
export declare const FIAT_CURRENCIES: Currency[];
export declare const CRYPTO_CURRENCIES: Currency[];
export declare const SUPPORTED_CURRENCIES: Currency[];
export declare const DEPOSIT_FEE_PERCENT = 3;
export declare const TRANSFER_FEE_PERCENT = 3;
export declare const EXCHANGE_FEE_PERCENT = 3;
export declare const MERCHANT_FEE_PERCENT = 3;
export declare const CURRENCY_LABELS: Record<string, string>;
export declare function calcFee(amount: number, percent: number): number;
export declare function calcNetAfterFee(amount: number, percent: number): {
    fee: number;
    net: number;
};
