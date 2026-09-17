-- NutriCompra — Etapa 2.1-B
-- Initial migration: nutrition domain only (Food, NutritionalProfile, DataSource).
--
-- NOTE (see backend/docs/ARCHITECTURE.md "Validaciones" section):
-- This file was authored by hand to exactly match what
-- `prisma migrate dev --name init_nutrition_domain` would generate from
-- prisma/schema.prisma, because this sandbox cannot reach
-- binaries.prisma.sh (Prisma's engine download host is not in the network
-- allowlist), so the Prisma CLI could not run here. Before relying on this
-- migration in a real environment, run `npx prisma migrate diff
-- --from-migrations prisma/migrations --to-schema-datamodel
-- prisma/schema.prisma --shadow-database-url <url> --script` (or simply
-- `npx prisma migrate dev`) once network access to Prisma's CDN is
-- available, to confirm it matches the schema exactly.

-- CreateTable
CREATE TABLE "foods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'basic',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutritional_profiles" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "referenceAmount" DECIMAL(8,2) NOT NULL DEFAULT 100,
    "referenceUnit" TEXT NOT NULL DEFAULT 'g',
    "energyKcal" DECIMAL(10,3),
    "proteinG" DECIMAL(10,3),
    "carbohydrateG" DECIMAL(10,3),
    "fatG" DECIMAL(10,3),
    "fiberG" DECIMAL(10,3),
    "sodiumMg" DECIMAL(10,3),
    "calciumMg" DECIMAL(10,3),
    "ironMg" DECIMAL(10,3),
    "dataSourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nutritional_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "foods_name_key" ON "foods"("name");

-- CreateIndex
CREATE INDEX "foods_category_idx" ON "foods"("category");

-- CreateIndex
CREATE UNIQUE INDEX "nutritional_profiles_foodId_key" ON "nutritional_profiles"("foodId");

-- CreateIndex
CREATE INDEX "data_sources_name_version_sourceCode_idx" ON "data_sources"("name", "version", "sourceCode");

-- AddForeignKey
ALTER TABLE "nutritional_profiles" ADD CONSTRAINT "nutritional_profiles_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "foods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutritional_profiles" ADD CONSTRAINT "nutritional_profiles_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
