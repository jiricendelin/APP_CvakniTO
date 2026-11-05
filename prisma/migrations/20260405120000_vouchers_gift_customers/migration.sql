-- AlterTable
ALTER TABLE "price_items" ADD COLUMN "gift_eligible" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "receipts" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'bezna';
ALTER TABLE "receipts" ADD COLUMN "gift_customer_id" UUID;
ALTER TABLE "receipts" ADD COLUMN "reminders_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "receipts" ADD COLUMN "reminder_sent_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "gift_customers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "last_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "awaiting_storno_payment" BOOLEAN NOT NULL DEFAULT false,
    "storno_fee_cents" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "valid_until" DATE NOT NULL,
    "buyer_name" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "buyer_email" TEXT NOT NULL DEFAULT '',
    "price_cents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'vystaveny',
    "kind" TEXT NOT NULL,
    "price_item_id" UUID,
    "service_name" TEXT NOT NULL DEFAULT '',
    "receipt_id" UUID,
    "gift_customer_id" UUID,
    "note" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "to_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT NOT NULL DEFAULT '',
    "meta" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gift_customers_tenant_id_idx" ON "gift_customers"("tenant_id");

-- CreateIndex
CREATE INDEX "gift_customers_tenant_id_last_name_idx" ON "gift_customers"("tenant_id", "last_name");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_receipt_id_key" ON "vouchers"("receipt_id");

-- CreateIndex
CREATE INDEX "vouchers_tenant_id_idx" ON "vouchers"("tenant_id");

-- CreateIndex
CREATE INDEX "vouchers_tenant_id_status_idx" ON "vouchers"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "vouchers_tenant_id_valid_until_idx" ON "vouchers"("tenant_id", "valid_until");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_tenant_id_number_key" ON "vouchers"("tenant_id", "number");

-- CreateIndex
CREATE INDEX "mail_logs_tenant_id_created_at_idx" ON "mail_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "receipts_tenant_id_kind_idx" ON "receipts"("tenant_id", "kind");

-- CreateIndex
CREATE INDEX "receipts_gift_customer_id_idx" ON "receipts"("gift_customer_id");

-- AddForeignKey
ALTER TABLE "gift_customers" ADD CONSTRAINT "gift_customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_gift_customer_id_fkey" FOREIGN KEY ("gift_customer_id") REFERENCES "gift_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_price_item_id_fkey" FOREIGN KEY ("price_item_id") REFERENCES "price_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_gift_customer_id_fkey" FOREIGN KEY ("gift_customer_id") REFERENCES "gift_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_logs" ADD CONSTRAINT "mail_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
