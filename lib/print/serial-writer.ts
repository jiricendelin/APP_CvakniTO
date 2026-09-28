export async function openSerialPort(
  port: SerialPort,
  baudRate: number
): Promise<void> {
  if (port.readable !== null || port.writable !== null) {
    return;
  }
  await port.open({ baudRate });
}

export async function writeToSerialPort(
  port: SerialPort,
  data: Uint8Array
): Promise<void> {
  if (!port.writable) {
    throw new Error("Port není otevřený pro zápis.");
  }
  const writer = port.writable.getWriter();
  try {
    await writer.write(data);
  } finally {
    writer.releaseLock();
  }
}

export function isWebSerialSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.serial;
}

export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.bluetooth;
}
