"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  TEST_QR_PAYLOAD,
  TEST_SENTENCE,
  RASTER_WIDTH_PX,
} from "@/lib/print/constants";
import {
  bitmapFromCanvas,
  concatBytes,
  escposFeed,
  escposInit,
  escposQrNative,
  escposRaster,
  escposSelectCodePage,
  escposTextCp852,
  renderTextToCanvas,
} from "@/lib/print/escpos";
import { renderQrToCanvas } from "@/lib/print/raster-client";
import {
  attachBleWriterForPrint,
  attachSerialPortForPrint,
} from "@/lib/print/receipt-printer";
import {
  isWebBluetoothSupported,
  isWebSerialSupported,
  openSerialPort,
  writeToSerialPort,
} from "@/lib/print/serial-writer";
import { savePrinterBaudRate } from "@/lib/print/printer-prefs";

const STORAGE_KEY = "cvaknito.printSpikeChoice";

type PrintMethod = "text-cp852" | "raster" | "qr-native" | "qr-raster";

type BleWriter = (data: Uint8Array) => Promise<void>;

export function PrintSpike() {
  const portRef = useRef<SerialPort | null>(null);
  const bleWriteRef = useRef<BleWriter | null>(null);
  const [baudRate, setBaudRate] = useState(9600);
  const [codePage, setCodePage] = useState(18);
  const [status, setStatus] = useState("Nepřipojeno");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [choice, setChoice] = useState<PrintMethod>("raster");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (
      saved === "text-cp852" ||
      saved === "raster" ||
      saved === "qr-native" ||
      saved === "qr-raster"
    ) {
      setChoice(saved);
    }
    const savedNotes = localStorage.getItem(`${STORAGE_KEY}.notes`);
    if (savedNotes) setNotes(savedNotes);
  }, []);

  const saveChoice = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, choice);
    localStorage.setItem(`${STORAGE_KEY}.notes`, notes);
    setStatus("Volba uložena do prohlížeče (pro R15).");
  }, [choice, notes]);

  const writeBytes = useCallback(async (data: Uint8Array) => {
    if (portRef.current) {
      await writeToSerialPort(portRef.current, data);
      return;
    }
    if (bleWriteRef.current) {
      await bleWriteRef.current(data);
      return;
    }
    throw new Error("Nejdřív připoj tiskárnu (Web Serial nebo Bluetooth).");
  }, []);

  const connectSerial = async () => {
    setError(null);
    if (!isWebSerialSupported()) {
      setError(
        "Web Serial není k dispozici. Na Androidu potřebuješ Chrome 138+ a HTTPS."
      );
      return;
    }
    try {
      const port = await navigator.serial!.requestPort();
      await openSerialPort(port, baudRate);
      portRef.current = port;
      bleWriteRef.current = null;
      attachSerialPortForPrint(port);
      savePrinterBaudRate(baudRate);
      setStatus(`Web Serial připojeno (${baudRate} baud)`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Připojení Web Serial selhalo.");
    }
  };

  const connectBluetooth = async () => {
    setError(null);
    if (!isWebBluetoothSupported()) {
      setError("Web Bluetooth v tomto prohlížeči není k dispozici.");
      return;
    }
    try {
      const device = await navigator.bluetooth!.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
          "49535343-fe7d-4ae5-8fa5-9cfffe7b9e0b",
        ],
      });
      const server = await device.gatt?.connect();
      if (!server) throw new Error("GATT server nedostupný.");

      let service = null;
      for (const uuid of [
        "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
        "49535343-fe7d-4ae5-8fa5-9cfffe7b9e0b",
      ]) {
        try {
          service = await server.getPrimaryService(uuid);
          break;
        } catch {
          /* zkus další UUID */
        }
      }
      if (!service) {
        throw new Error(
          "Nenašel jsem známou serial službu. U Cashino SPP zkus raději Web Serial."
        );
      }

      const writeUuid =
        service.uuid === "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
          ? "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
          : "49535343-8841-43f4-a8d4-ecbe34729bb3";

      const characteristic = await service.getCharacteristic(writeUuid);
      bleWriteRef.current = async (data: Uint8Array) => {
        const chunkSize = 100;
        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk = data.subarray(i, i + chunkSize);
          await characteristic.writeValue(new Uint8Array(chunk));
        }
      };
      portRef.current = null;
      attachSerialPortForPrint(null);
      attachBleWriterForPrint(bleWriteRef.current);
      setStatus(`Web Bluetooth: ${device.name ?? "tiskárna"}`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Bluetooth připojení selhalo (u SPP tiskáren často nepůjde)."
      );
    }
  };

  const disconnect = async () => {
    setError(null);
    try {
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
      bleWriteRef.current = null;
      attachSerialPortForPrint(null);
      attachBleWriterForPrint(null);
      setStatus("Odpojeno");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Odpojení selhalo.");
    }
  };

  const runJob = async (label: string, build: () => Promise<Uint8Array>) => {
    setBusy(true);
    setError(null);
    setStatus(`Tisk: ${label}…`);
    try {
      const payload = await build();
      await writeBytes(payload);
      setStatus(`Hotovo: ${label}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tisk selhal.");
      setStatus("Chyba tisku");
    } finally {
      setBusy(false);
    }
  };

  const printTextCp852 = () =>
    runJob("text CP852", async () =>
      concatBytes(
        escposInit(),
        escposSelectCodePage(codePage),
        escposTextCp852(`${TEST_SENTENCE}\n\n`),
        escposFeed(4)
      )
    );

  const printRaster = () =>
    runJob("rastr textu", async () => {
      const canvas = renderTextToCanvas(TEST_SENTENCE, RASTER_WIDTH_PX);
      const { bitmap, width, height } = bitmapFromCanvas(canvas);
      return concatBytes(
        escposInit(),
        escposRaster(bitmap, width, height),
        escposFeed(4)
      );
    });

  const printQrNative = () =>
    runJob("QR nativní", async () =>
      concatBytes(
        escposInit(),
        escposTextCp852("QR test (nativní ESC/POS):\n"),
        escposQrNative(TEST_QR_PAYLOAD),
        escposFeed(4)
      )
    );

  const printQrRaster = () =>
    runJob("QR rastr", async () => {
      const canvas = await renderQrToCanvas(TEST_QR_PAYLOAD, 280);
      const { bitmap, width, height } = bitmapFromCanvas(canvas);
      return concatBytes(
        escposInit(),
        escposTextCp852("QR test (rastr):\n"),
        escposRaster(bitmap, width, height),
        escposFeed(4)
      );
    });

  const btnClass =
    "rounded-lg border border-border bg-background px-3 py-3 text-sm font-medium hover:bg-accent disabled:opacity-50";

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Tisk — spike (R6)</h1>
        <p className="text-sm text-muted-foreground">
          Cashino PTP-II ve spárování Bluetooth → Web Serial v Chrome 138+ (Android).
          Věta: „{TEST_SENTENCE}“
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-border p-4">
        <p className="text-sm font-medium">Připojení</p>
        <p className="text-xs text-muted-foreground">{status}</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs">
            Baud
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
              value={baudRate}
              onChange={(e) => setBaudRate(Number(e.target.value))}
            >
              <option value={9600}>9600</option>
              <option value={115200}>115200</option>
            </select>
          </label>
          <label className="text-xs">
            Code page (autotest)
            <input
              type="number"
              min={0}
              max={255}
              className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
              value={codePage}
              onChange={(e) => setCodePage(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button type="button" className={btnClass} onClick={connectSerial}>
            Připojit Web Serial
          </button>
          <button type="button" className={btnClass} onClick={connectBluetooth}>
            Web Bluetooth (záloha)
          </button>
          <button
            type="button"
            className={btnClass}
            onClick={disconnect}
            disabled={busy}
          >
            Odpojit
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Testovací tisk</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={busy}
            className={btnClass}
            onClick={printTextCp852}
          >
            1. Text CP852
          </button>
          <button
            type="button"
            disabled={busy}
            className={btnClass}
            onClick={printRaster}
          >
            2. Rastr (canvas 384 px)
          </button>
          <button
            type="button"
            disabled={busy}
            className={btnClass}
            onClick={printQrNative}
          >
            3. QR nativní
          </button>
          <button
            type="button"
            disabled={busy}
            className={btnClass}
            onClick={printQrRaster}
          >
            4. QR rastr
          </button>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
        <p className="text-sm font-medium">Zápis pro R15 (po fyzickém testu)</p>
        <fieldset className="space-y-2 text-sm">
          {(
            [
              ["text-cp852", "Text CP852"],
              ["raster", "Rastr textu"],
              ["qr-native", "QR nativní ESC/POS"],
              ["qr-raster", "QR rastr"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2">
              <input
                type="radio"
                name="print-choice"
                checked={choice === value}
                onChange={() => setChoice(value)}
              />
              {label}
            </label>
          ))}
        </fieldset>
        <label className="block text-xs">
          Poznámka (code page, baud, tiskárna)
          <textarea
            className="mt-1 min-h-[4rem] w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="např. code page 18, rastr OK, QR nativní nečitelný…"
          />
        </label>
        <button type="button" className={btnClass} onClick={saveChoice}>
          Uložit volbu v prohlížeči
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
