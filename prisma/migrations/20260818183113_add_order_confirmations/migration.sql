-- CreateEnum
CREATE TYPE "OrderConfirmationStatus" AS ENUM ('EN_ATTENTE', 'CONVERTIE', 'ANNULEE');

-- CreateTable
CREATE TABLE "order_confirmations" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" "Currency" NOT NULL DEFAULT 'MAD',
    "exchangeRate" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL,
    "vatAmount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "status" "OrderConfirmationStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "invoiceId" TEXT,

    CONSTRAINT "order_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_confirmation_items" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "orderConfirmationId" TEXT NOT NULL,
    "productId" TEXT,

    CONSTRAINT "order_confirmation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_confirmation_counter" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "order_confirmation_counter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_confirmations_number_key" ON "order_confirmations"("number");

-- CreateIndex
CREATE UNIQUE INDEX "order_confirmations_invoiceId_key" ON "order_confirmations"("invoiceId");

-- CreateIndex
CREATE INDEX "order_confirmations_customerId_idx" ON "order_confirmations"("customerId");

-- CreateIndex
CREATE INDEX "order_confirmations_date_idx" ON "order_confirmations"("date");

-- CreateIndex
CREATE INDEX "order_confirmation_items_orderConfirmationId_idx" ON "order_confirmation_items"("orderConfirmationId");

-- CreateIndex
CREATE INDEX "order_confirmation_items_productId_idx" ON "order_confirmation_items"("productId");

-- AddForeignKey
ALTER TABLE "order_confirmations" ADD CONSTRAINT "order_confirmations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_confirmations" ADD CONSTRAINT "order_confirmations_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_confirmation_items" ADD CONSTRAINT "order_confirmation_items_orderConfirmationId_fkey" FOREIGN KEY ("orderConfirmationId") REFERENCES "order_confirmations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_confirmation_items" ADD CONSTRAINT "order_confirmation_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
