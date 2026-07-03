"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CURRENCY_LABELS = exports.MERCHANT_FEE_PERCENT = exports.EXCHANGE_FEE_PERCENT = exports.TRANSFER_FEE_PERCENT = exports.DEPOSIT_FEE_PERCENT = exports.SUPPORTED_CURRENCIES = exports.CRYPTO_CURRENCIES = exports.FIAT_CURRENCIES = exports.UserRole = exports.KycStatus = exports.TransactionStatus = exports.TransactionType = exports.Currency = void 0;
exports.calcFee = calcFee;
exports.calcNetAfterFee = calcNetAfterFee;
var Currency;
(function (Currency) {
    Currency["USD"] = "USD";
    Currency["EUR"] = "EUR";
    Currency["GBP"] = "GBP";
    Currency["RUB"] = "RUB";
    Currency["KZT"] = "KZT";
    Currency["UAH"] = "UAH";
    Currency["TRY"] = "TRY";
    Currency["AED"] = "AED";
    Currency["CNY"] = "CNY";
    Currency["JPY"] = "JPY";
    Currency["BTC"] = "BTC";
    Currency["ETH"] = "ETH";
    Currency["USDT"] = "USDT";
})(Currency || (exports.Currency = Currency = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["DEPOSIT"] = "deposit";
    TransactionType["WITHDRAWAL"] = "withdrawal";
    TransactionType["TRANSFER"] = "transfer";
    TransactionType["EXCHANGE"] = "exchange";
    TransactionType["MERCHANT_PAYMENT"] = "merchant_payment";
    TransactionType["REFUND"] = "refund";
    TransactionType["PLATFORM_FEE"] = "platform_fee";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["PROCESSING"] = "processing";
    TransactionStatus["COMPLETED"] = "completed";
    TransactionStatus["FAILED"] = "failed";
    TransactionStatus["CANCELLED"] = "cancelled";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var KycStatus;
(function (KycStatus) {
    KycStatus["NOT_STARTED"] = "not_started";
    KycStatus["PENDING"] = "pending";
    KycStatus["VERIFIED"] = "verified";
    KycStatus["REJECTED"] = "rejected";
})(KycStatus || (exports.KycStatus = KycStatus = {}));
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["MERCHANT"] = "merchant";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
exports.FIAT_CURRENCIES = [
    Currency.USD, Currency.EUR, Currency.GBP, Currency.RUB,
    Currency.KZT, Currency.UAH, Currency.TRY, Currency.AED,
    Currency.CNY, Currency.JPY,
];
exports.CRYPTO_CURRENCIES = [Currency.BTC, Currency.ETH, Currency.USDT];
exports.SUPPORTED_CURRENCIES = Object.values(Currency);
exports.DEPOSIT_FEE_PERCENT = 3;
exports.TRANSFER_FEE_PERCENT = 3;
exports.EXCHANGE_FEE_PERCENT = 3;
exports.MERCHANT_FEE_PERCENT = 3;
exports.CURRENCY_LABELS = {
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
function calcFee(amount, percent) {
    return amount * (percent / 100);
}
function calcNetAfterFee(amount, percent) {
    const fee = calcFee(amount, percent);
    return { fee, net: amount - fee };
}
//# sourceMappingURL=index.js.map