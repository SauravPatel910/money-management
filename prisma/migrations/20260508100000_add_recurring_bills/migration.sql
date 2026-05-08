CREATE TABLE "recurring_bills" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "account" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "subcategory_id" TEXT,
    "frequency" TEXT NOT NULL,
    "next_due_date" TIMESTAMP(3) NOT NULL,
    "reminder_days" INTEGER NOT NULL DEFAULT 3,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_bills_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recurring_bill_payments" (
    "id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "occurrence_date" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_bill_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "recurring_bills_user_id_idx" ON "recurring_bills"("user_id");
CREATE INDEX "recurring_bills_next_due_date_idx" ON "recurring_bills"("next_due_date");
CREATE INDEX "recurring_bills_category_id_idx" ON "recurring_bills"("category_id");
CREATE INDEX "recurring_bills_subcategory_id_idx" ON "recurring_bills"("subcategory_id");
CREATE UNIQUE INDEX "recurring_bill_payments_bill_id_occurrence_date_key" ON "recurring_bill_payments"("bill_id", "occurrence_date");
CREATE UNIQUE INDEX "recurring_bill_payments_transaction_id_key" ON "recurring_bill_payments"("transaction_id");
CREATE INDEX "recurring_bill_payments_bill_id_idx" ON "recurring_bill_payments"("bill_id");
CREATE INDEX "recurring_bill_payments_transaction_id_idx" ON "recurring_bill_payments"("transaction_id");

ALTER TABLE "recurring_bills" ADD CONSTRAINT "recurring_bills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recurring_bills" ADD CONSTRAINT "recurring_bills_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "transaction_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recurring_bills" ADD CONSTRAINT "recurring_bills_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "transaction_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "recurring_bill_payments" ADD CONSTRAINT "recurring_bill_payments_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "recurring_bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recurring_bill_payments" ADD CONSTRAINT "recurring_bill_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
