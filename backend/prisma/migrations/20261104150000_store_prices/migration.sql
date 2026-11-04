-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_products" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "sourceSku" TEXT NOT NULL,
    "ean" TEXT,
    "groupKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "searchName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "listPriceCents" INTEGER NOT NULL,
    "inStock" BOOLEAN NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stores_code_key" ON "stores"("code");

-- CreateIndex
CREATE INDEX "store_products_groupKey_idx" ON "store_products"("groupKey");

-- CreateIndex
CREATE UNIQUE INDEX "store_products_storeId_sourceSku_key" ON "store_products"("storeId", "sourceSku");

-- AddForeignKey
ALTER TABLE "store_products" ADD CONSTRAINT "store_products_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

