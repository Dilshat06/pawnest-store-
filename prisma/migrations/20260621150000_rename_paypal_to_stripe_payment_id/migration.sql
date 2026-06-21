-- Откат с PayPal на Stripe: переименовываем колонку, не теряя данные
ALTER TABLE "Order" RENAME COLUMN "paypalOrderId" TO "stripePaymentId";

DROP INDEX "Order_paypalOrderId_idx";
CREATE INDEX "Order_stripePaymentId_idx" ON "Order"("stripePaymentId");
