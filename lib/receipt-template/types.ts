export type ReceiptTemplateItem = {
  name: string;
  quantity: number;
  priceCents: number;
  lineTotalCents: number;
  category: string;
};

export type ReceiptTemplateContext = {
  companyName: string;
  companyIco: string;
  companyDic: string;
  companyAddress: string;
  bankAccount: string;
  iban: string;
  number: string;
  variableSymbol: string;
  datetime: string;
  paymentLabel: string;
  paymentType: string;
  totalCents: number;
  items: ReceiptTemplateItem[];
  qrSpayd: string | null;
  eetStatusLabel: string;
  eetFik: string | null;
  eetBkp: string | null;
};
