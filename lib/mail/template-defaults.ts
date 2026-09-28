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
