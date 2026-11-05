/**
 * Stub pro budoucí notifikaci (Telegram / n8n webhook).
 * Záměrně nic neposílá — doplníme později.
 */
export type ReminderHookPayload = {
  tenantId: string;
  receiptId: string;
  receiptNumber: string;
  to: string;
  totalCents: number;
};

export async function notifyReminderHook(
  payload: ReminderHookPayload
): Promise<void> {
  void payload;
  // TODO: napojit na webhook / Telegram
}
