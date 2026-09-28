function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get sessionSecret() {
    return required("SESSION_SECRET");
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
  get bankIngestToken() {
    return process.env.BANK_INGEST_TOKEN ?? "";
  },
};
