export const DEFAULT_MAIL_INVOICE_SUBJECT = "Faktura {{invoiceNumber}} — {{companyName}}";

export const DEFAULT_MAIL_INVOICE_TEXT = `Dobrý den,

v příloze zasíláme fakturu č. {{invoiceNumber}} v celkové výši {{totalCzk}}.

Variabilní symbol: {{variableSymbol}}
Splatnost: {{dueDate}}

{{companyName}}`;

export const DEFAULT_MAIL_REMINDER_SUBJECT =
  "Upomínka — faktura {{invoiceNumber}} po splatnosti";

export const DEFAULT_MAIL_REMINDER_TEXT = `Dobrý den,

dovolujeme si Vás upozornit, že faktura č. {{invoiceNumber}} ve výši {{totalCzk}} je po splatnosti ({{dueDate}}).

Variabilní symbol: {{variableSymbol}}

Prosíme o úhradu.

{{companyName}}`;

export const DEFAULT_MAIL_THANKS_SUBJECT =
  "Děkujeme za úhradu faktury {{invoiceNumber}}";

export const DEFAULT_MAIL_THANKS_TEXT = `Dobrý den,

potvrzujeme přijetí platby k faktuře č. {{invoiceNumber}}.

Děkujeme.

{{companyName}}`;

export const DEFAULT_MAIL_VOUCHER_SUBJECT =
  "Dárkový poukaz {{voucherNumber}} — {{companyName}}";

export const DEFAULT_MAIL_VOUCHER_TEXT = `Dobrý den,

v příloze zasíláme dárkový poukaz č. {{voucherNumber}} a účtenku s platebními údaji.

Částka: {{totalCzk}}
Variabilní symbol: {{variableSymbol}}
Platnost poukazu do: {{validUntil}}

Prosíme o úhradu převodem (QR kód je na účtence).

{{companyName}}`;

export const DEFAULT_MAIL_VOUCHER_ACTIVATION_SUBJECT =
  "Aktivace dárkového poukazu {{voucherNumber}}";

export const DEFAULT_MAIL_VOUCHER_ACTIVATION_TEXT = `Dobrý den,

potvrzujeme přijetí platby. Dárkový poukaz č. {{voucherNumber}} je aktivní.

Platnost do: {{validUntil}}
Obdarovaný: {{recipientName}}

{{companyName}}`;

export const DEFAULT_MAIL_RECEIPT_SUBJECT =
  "Účtenka {{receiptNumber}} — {{companyName}}";

export const DEFAULT_MAIL_RECEIPT_TEXT = `Dobrý den,

v příloze zasíláme účtenku č. {{receiptNumber}} v celkové výši {{totalCzk}}.

Variabilní symbol: {{variableSymbol}}

{{companyName}}`;

export const DEFAULT_MAIL_RECEIPT_REMINDER_SUBJECT =
  "Upomínka — účtenka {{receiptNumber}} čeká na úhradu";

export const DEFAULT_MAIL_RECEIPT_REMINDER_TEXT = `Dobrý den,

dovolujeme si Vás upozornit, že účtenka č. {{receiptNumber}} ve výši {{totalCzk}} dosud nebyla uhrazena.

Variabilní symbol: {{variableSymbol}}

Prosíme o úhradu.

{{companyName}}`;
