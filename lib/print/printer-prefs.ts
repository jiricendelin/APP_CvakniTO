export type QrPrintMode = "qr-native" | "qr-raster";

const BAUD_KEY = "cvaknito.printer.baudRate";
const SPIKE_CHOICE_KEY = "cvaknito.printSpikeChoice";

export type PrinterPrefs = {
  baudRate: number;
  qrMode: QrPrintMode;
};

export function loadPrinterPrefs(): PrinterPrefs {
  let baudRate = 9600;
  try {
    const raw = localStorage.getItem(BAUD_KEY);
    if (raw) {
      const n = Number(raw);
      if (n === 9600 || n === 115200) baudRate = n;
    }
  } catch {
    /* ignore */
  }

  let qrMode: QrPrintMode = "qr-raster";
  try {
    const spike = localStorage.getItem(SPIKE_CHOICE_KEY);
    if (spike === "qr-native") qrMode = "qr-native";
  } catch {
    /* ignore */
  }

  return { baudRate, qrMode };
}

export function savePrinterBaudRate(baudRate: number): void {
  try {
    localStorage.setItem(BAUD_KEY, String(baudRate));
  } catch {
    /* ignore */
  }
}
