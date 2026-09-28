-- AlterTable
ALTER TABLE "receipts" ADD COLUMN "eet_pok" TEXT,
ADD COLUMN "eet_bkp" TEXT,
ADD COLUMN "eet_pkp" TEXT,
ADD COLUMN "storned_at" TIMESTAMP(3),
ADD COLUMN "corrects_receipt_id" UUID;

-- CreateTable
CREATE TABLE "eet_records" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "receipt_id" UUID NOT NULL,
    "message_uuid" TEXT NOT NULL,
    "bkp" TEXT NOT NULL DEFAULT '',
    "pkp" TEXT NOT NULL DEFAULT '',
    "pok" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL,
    "error_message" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'sale',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eet_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "eet_records_tenant_id_receipt_id_idx" ON "eet_records"("tenant_id", "receipt_id");

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_corrects_receipt_id_fkey" FOREIGN KEY ("corrects_receipt_id") REFERENCES "receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eet_records" ADD CONSTRAINT "eet_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eet_records" ADD CONSTRAINT "eet_records_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
