/** CP852 bajty pro českou diakritiku (ESC/POS code page 18 na většině 58mm tiskáren). */
const CP852: Record<string, number> = {
  "Á": 0xc1,
  "É": 0xc9,
  "Í": 0xcd,
  "Ó": 0xd3,
  "Ú": 0xda,
  "Ý": 0xdd,
  "Č": 0xc8,
  "Ď": 0xcf,
  "Ě": 0xcc,
  "Ň": 0xd2,
  "Ř": 0xd8,
  "Š": 0x8a,
  "Ť": 0x8d,
  "Ů": 0xd9,
  "Ž": 0x8e,
  "á": 0xe1,
  "é": 0xe9,
  "í": 0xed,
  "ó": 0xf3,
  "ú": 0xfa,
  "ý": 0xfd,
  "č": 0xe8,
  "ď": 0xef,
  "ě": 0xec,
  "ň": 0xf2,
  "ř": 0xf8,
  "š": 0x9a,
  "ť": 0x9d,
  "ů": 0xf9,
  "ž": 0x9e,
  "Ö": 0xd6,
  "Ü": 0xdc,
  "ä": 0xe4,
  "ö": 0xf6,
  "ü": 0xfc,
  "ß": 0xdf,
};

export function encodeCp852(text: string): Uint8Array {
  const out: number[] = [];
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if (code < 0x80) {
      out.push(code);
      continue;
    }
    const byte = CP852[ch];
    out.push(byte ?? 0x3f);
  }
  return new Uint8Array(out);
}
