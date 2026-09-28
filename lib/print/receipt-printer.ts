"use client";

import type { ReceiptPrintPayload } from "@/lib/receipt-template/render-print";
import { buildReceiptPrintJob } from "./build-receipt-job";
import { loadPrinterPrefs } from "./printer-prefs";
import {
  isWebSerialSupported,
  openSerialPort,
  writeToSerialPort,
} from "./serial-writer";

type BleWriter = (data: Uint8Array) => Promise<void>;

let serialPort: SerialPort | null = null;
let bleWrite: BleWriter | null = null;

export type ReceiptPrintResult =
  | { ok: true }
  | { ok: false; message: string; needsConnect?: boolean };

export function isPrinterConnected(): boolean {
  return serialPort !== null || bleWrite !== null;
}

export async function connectReceiptPrinter(): Promise<ReceiptPrintResult> {
  if (!isWebSerialSupported()) {
    return {
      ok: false,
      message:
        "Tiskárnu tu neumím otevřít — v Chrome na Androidu (HTTPS) zvol Web Serial.",
      needsConnect: true,
    };
  }
  try {
    const prefs = loadPrinterPrefs();
    const ports = await navigator.serial!.getPorts();
    if (ports.length > 0) {
      const port = ports[0]!;
      await openSerialPort(port, prefs.baudRate);
      serialPort = port;
      bleWrite = null;
      return { ok: true };
    }
    const port = await navigator.serial!.requestPort();
    await openSerialPort(port, prefs.baudRate);
    serialPort = port;
    bleWrite = null;
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      message:
        e instanceof Error
          ? e.message
          : "Připojení tiskárny se nepodařilo.",
      needsConnect: true,
    };
  }
}

async function writeBytes(data: Uint8Array): Promise<void> {
  if (serialPort) {
    await writeToSerialPort(serialPort, data);
    return;
  }
  if (bleWrite) {
    await bleWrite(data);
    return;
  }
  throw new Error("NOT_CONNECTED");
}

export async function printReceiptPayload(
  payload: ReceiptPrintPayload
): Promise<ReceiptPrintResult> {
  if (!isPrinterConnected()) {
    const connected = await connectReceiptPrinter();
    if (!connected.ok) {
      return {
        ok: false,
        message:
          "Tiskárna není připojená. Účtenka je uložená — vytisknete ji z detailu po připojení.",
        needsConnect: true,
      };
    }
  }

  try {
    const prefs = loadPrinterPrefs();
    const job = await buildReceiptPrintJob(payload, prefs);
    await writeBytes(job);
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_CONNECTED") {
      serialPort = null;
      bleWrite = null;
      return printReceiptPayload(payload);
    }
    return {
      ok: false,
      message:
        e instanceof Error
          ? e.message
          : "Tisk selhal. Účtenka zůstává v aplikaci.",
    };
  }
}

/** Pro spike / ruční Bluetooth — sdílený stav s receipt tiskem. */
export function attachSerialPortForPrint(port: SerialPort | null): void {
  serialPort = port;
  if (port) bleWrite = null;
}

export function attachBleWriterForPrint(writer: BleWriter | null): void {
  bleWrite = writer;
  if (writer) serialPort = null;
}
