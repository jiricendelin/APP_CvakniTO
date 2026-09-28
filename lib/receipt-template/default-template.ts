/** Výchozí Handlebars šablona účtenky (58 mm / ~32 znaků na řádek). */
export const DEFAULT_RECEIPT_TEMPLATE = `{{companyName}}
{{companyAddress}}
IČO {{companyIco}}  DIČ {{companyDic}}
================================
Účtenka č. {{number}}
{{datetime}}
================================
{{#each items}}
{{name}} × {{quantity}}
     {{formatCzk lineTotalCents}}
{{/each}}
================================
CELKEM {{formatCzk totalCents}}
Platba: {{paymentLabel}}
VS: {{variableSymbol}}
{{#if qrSpayd}}
[QR platba]
{{/if}}
EET: {{eetStatusLabel}}
{{#if eetFik}}FIK: {{eetFik}}
{{/if}}{{#if eetBkp}}BKP: {{eetBkp}}
{{/if}}
Děkujeme za návštěvu`;
