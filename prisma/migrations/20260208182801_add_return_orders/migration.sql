-- CreateTable
CREATE TABLE "return_orders" (
    "id" TEXT NOT NULL,
    "return_number" TEXT NOT NULL,
    "original_order_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "return_type" TEXT NOT NULL DEFAULT 'refund',
    "reason" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "refund_method" TEXT NOT NULL,
    "refund_status" TEXT NOT NULL DEFAULT 'pending',
    "register_session_id" TEXT,
    "processed_by" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_order_items" (
    "id" TEXT NOT NULL,
    "return_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_refund" DECIMAL(10,2) NOT NULL,
    "restock_status" TEXT NOT NULL DEFAULT 'pending',
    "restocked_to_id" TEXT,

    CONSTRAINT "return_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "return_orders_return_number_key" ON "return_orders"("return_number");

-- CreateIndex
CREATE INDEX "return_orders_original_order_id_idx" ON "return_orders"("original_order_id");

-- CreateIndex
CREATE INDEX "return_orders_customer_id_idx" ON "return_orders"("customer_id");

-- CreateIndex
CREATE INDEX "return_orders_created_at_idx" ON "return_orders"("created_at");

-- CreateIndex
CREATE INDEX "return_order_items_product_id_idx" ON "return_order_items"("product_id");

-- AddForeignKey
ALTER TABLE "return_orders" ADD CONSTRAINT "return_orders_original_order_id_fkey" FOREIGN KEY ("original_order_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_orders" ADD CONSTRAINT "return_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_orders" ADD CONSTRAINT "return_orders_register_session_id_fkey" FOREIGN KEY ("register_session_id") REFERENCES "register_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_order_items" ADD CONSTRAINT "return_order_items_return_order_id_fkey" FOREIGN KEY ("return_order_id") REFERENCES "return_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
