export interface BankInfo {
  id: string;
  name: string;
  swift?: string;
  supportsOpenBanking: boolean;
}

export const BANKS_BY_COUNTRY: Record<string, BankInfo[]> = {
  RU: [
    { id: 'sber', name: 'Сбербанк', swift: 'SABRRUMM', supportsOpenBanking: true },
    { id: 'tinkoff', name: 'Т-Банк (Тинькофф)', swift: 'TICSRUMM', supportsOpenBanking: true },
    { id: 'vtb', name: 'ВТБ', swift: 'VTBRRUMM', supportsOpenBanking: true },
    { id: 'alfa', name: 'Альфа-Банк', swift: 'ALFARUMM', supportsOpenBanking: true },
    { id: 'gazprom', name: 'Газпромбанк', swift: 'GAZPRUMM', supportsOpenBanking: true },
    { id: 'raif', name: 'Райффайзенбанк', swift: 'RZBMRUMM', supportsOpenBanking: true },
    { id: 'rosbank', name: 'Росбанк', swift: 'RSBNRUMM', supportsOpenBanking: true },
    { id: 'otkritie', name: 'Открытие', supportsOpenBanking: true },
    { id: 'sovcom', name: 'Совкомбанк', supportsOpenBanking: true },
    { id: 'psb', name: 'ПСБ', supportsOpenBanking: true },
  ],
  KZ: [
    { id: 'halyk', name: 'Halyk Bank', swift: 'HSBKKZKX', supportsOpenBanking: true },
    { id: 'kaspi', name: 'Kaspi Bank', supportsOpenBanking: true },
    { id: 'forte', name: 'ForteBank', swift: 'IRTYKZKA', supportsOpenBanking: true },
    { id: 'bcc', name: 'Банк ЦентрКредит', swift: 'KCJBKZKX', supportsOpenBanking: true },
    { id: 'jusan', name: 'Jusan Bank', supportsOpenBanking: true },
  ],
  US: [
    { id: 'chase', name: 'JPMorgan Chase', swift: 'CHASUS33', supportsOpenBanking: true },
    { id: 'bofa', name: 'Bank of America', swift: 'BOFAUS3N', supportsOpenBanking: true },
    { id: 'wells', name: 'Wells Fargo', swift: 'WFBIUS6S', supportsOpenBanking: true },
    { id: 'citi', name: 'Citibank', swift: 'CITIUS33', supportsOpenBanking: true },
    { id: 'capital', name: 'Capital One', supportsOpenBanking: true },
  ],
  DE: [
    { id: 'deutsche', name: 'Deutsche Bank', swift: 'DEUTDEFF', supportsOpenBanking: true },
    { id: 'commerz', name: 'Commerzbank', swift: 'COBADEFF', supportsOpenBanking: true },
    { id: 'dkb', name: 'DKB', supportsOpenBanking: true },
    { id: 'n26', name: 'N26', supportsOpenBanking: true },
  ],
  GB: [
    { id: 'barclays', name: 'Barclays', swift: 'BARCGB22', supportsOpenBanking: true },
    { id: 'hsbc', name: 'HSBC', swift: 'HBUKGB4B', supportsOpenBanking: true },
    { id: 'lloyds', name: 'Lloyds Bank', swift: 'LOYDGB21', supportsOpenBanking: true },
    { id: 'revolut', name: 'Revolut', supportsOpenBanking: true },
    { id: 'monzo', name: 'Monzo', supportsOpenBanking: true },
  ],
  UA: [
    { id: 'privat', name: 'ПриватБанк', swift: 'PBANUA2X', supportsOpenBanking: true },
    { id: 'mono', name: 'Monobank', supportsOpenBanking: true },
    { id: 'oschad', name: 'Ощадбанк', supportsOpenBanking: true },
  ],
  BY: [
    { id: 'belarusbank', name: 'Беларусбанк', supportsOpenBanking: true },
    { id: 'belinvest', name: 'Белинвестбанк', supportsOpenBanking: true },
  ],
  AE: [
    { id: 'enbd', name: 'Emirates NBD', swift: 'EBILAEAD', supportsOpenBanking: true },
    { id: 'fab', name: 'First Abu Dhabi Bank', swift: 'NBADAEAA', supportsOpenBanking: true },
  ],
  TR: [
    { id: 'isbank', name: 'İş Bankası', swift: 'ISBKTRIS', supportsOpenBanking: true },
    { id: 'garanti', name: 'Garanti BBVA', swift: 'TGBATRIS', supportsOpenBanking: true },
  ],
  FR: [
    { id: 'bnp', name: 'BNP Paribas', swift: 'BNPAFRPP', supportsOpenBanking: true },
    { id: 'socgen', name: 'Société Générale', swift: 'SOGEFRPP', supportsOpenBanking: true },
    { id: 'credit_ag', name: 'Crédit Agricole', supportsOpenBanking: true },
  ],
};

export function getBanksForCountry(countryCode: string): BankInfo[] {
  return BANKS_BY_COUNTRY[countryCode.toUpperCase()] ?? [];
}
