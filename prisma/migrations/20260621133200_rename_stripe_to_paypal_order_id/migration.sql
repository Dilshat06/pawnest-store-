-- Переход со Stripe на PayPal: переименовываем колонку, не теряя данные
ALTER TABLE "Order" RENAME COLUMN "stripePaymentId" TO "paypalOrderId";

DROP INDEX "Order_stripePaymentId_idx";
CREATE INDEX "Order_paypalOrderId_idx" ON "Order"("paypalOrderId");
