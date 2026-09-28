-- CreateTable
CREATE TABLE "price_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_items_tenant_id_idx" ON "price_items"("tenant_id");

-- CreateIndex
CREATE INDEX "price_items_tenant_id_active_idx" ON "price_items"("tenant_id", "active");

-- AddForeignKey
ALTER TABLE "price_items" ADD CONSTRAINT "price_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
