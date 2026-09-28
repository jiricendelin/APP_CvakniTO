-- AlterTable
ALTER TABLE "receipts" ADD COLUMN "paid_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "move_id" TEXT NOT NULL,
    "variable_symbol" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "booked_at" TIMESTAMP(3),
    "message" TEXT NOT NULL DEFAULT '',
    "receipt_id" UUID,
    "invoice_id" UUID,
    "matched" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_tenant_id_move_id_key" ON "payments"("tenant_id", "move_id");

-- CreateIndex
CREATE INDEX "payments_tenant_id_matched_idx" ON "payments"("tenant_id", "matched");

-- CreateIndex
CREATE INDEX "payments_tenant_id_variable_symbol_idx" ON "payments"("tenant_id", "variable_symbol");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
