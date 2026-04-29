-- CreateTable
CREATE TABLE "transaction_categories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_categories_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "category_id" TEXT;
ALTER TABLE "transactions" ADD COLUMN "subcategory_id" TEXT;

-- CreateIndex
CREATE INDEX "transaction_categories_user_id_idx" ON "transaction_categories"("user_id");
CREATE INDEX "transaction_categories_parent_id_idx" ON "transaction_categories"("parent_id");
CREATE INDEX "transaction_categories_type_idx" ON "transaction_categories"("type");
CREATE UNIQUE INDEX "transaction_categories_user_id_type_name_parent_id_key" ON "transaction_categories"("user_id", "type", "name", "parent_id");
CREATE INDEX "transactions_category_id_idx" ON "transactions"("category_id");
CREATE INDEX "transactions_subcategory_id_idx" ON "transactions"("subcategory_id");

-- AddForeignKey
ALTER TABLE "transaction_categories" ADD CONSTRAINT "transaction_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transaction_categories" ADD CONSTRAINT "transaction_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "transaction_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "transaction_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "transaction_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
