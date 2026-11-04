-- CreateTable
CREATE TABLE "scrape_runs" (
    "id" TEXT NOT NULL,
    "storeCode" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "products" INTEGER,
    "error" TEXT,

    CONSTRAINT "scrape_runs_pkey" PRIMARY KEY ("id")
);

