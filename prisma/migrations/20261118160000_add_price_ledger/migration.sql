-- CreateTable
CREATE TABLE "LedgerProduct" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "codeKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '',
    "distRate" DOUBLE PRECISION,
    "consRate" DOUBLE PRECISION,
    "distFixed" DOUBLE PRECISION,
    "consFixed" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "productId" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerPrice" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplyNet" DOUBLE PRECISION NOT NULL,
    "validFrom" DATE NOT NULL,
    "changeId" TEXT,
    "note" TEXT NOT NULL DEFAULT '',
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerDistributor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isStandard" BOOLEAN NOT NULL DEFAULT false,
    "refRate" DOUBLE PRECISION,
    "note" TEXT NOT NULL DEFAULT '',
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "companyId" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerDistributor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerPriceChange" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "dir" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "adjustFixed" BOOLEAN NOT NULL DEFAULT false,
    "fixedBefore" JSONB NOT NULL DEFAULT '{}',
    "count" INTEGER NOT NULL DEFAULT 0,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerPriceChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerOrder" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT,
    "date" DATE NOT NULL,
    "distributorId" TEXT NOT NULL,
    "basis" TEXT NOT NULL DEFAULT 'net',
    "note" TEXT NOT NULL DEFAULT '',
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerOrderLine" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LedgerOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LedgerProduct_codeKey_key" ON "LedgerProduct"("codeKey");

-- CreateIndex
CREATE INDEX "LedgerProduct_productId_idx" ON "LedgerProduct"("productId");

-- CreateIndex
CREATE INDEX "LedgerPrice_productId_validFrom_idx" ON "LedgerPrice"("productId", "validFrom");

-- CreateIndex
CREATE INDEX "LedgerPrice_changeId_idx" ON "LedgerPrice"("changeId");

-- CreateIndex
CREATE INDEX "LedgerDistributor_companyId_idx" ON "LedgerDistributor"("companyId");

-- CreateIndex
CREATE INDEX "LedgerPriceChange_date_idx" ON "LedgerPriceChange"("date");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerOrder_orderNo_key" ON "LedgerOrder"("orderNo");

-- CreateIndex
CREATE INDEX "LedgerOrder_date_idx" ON "LedgerOrder"("date");

-- CreateIndex
CREATE INDEX "LedgerOrder_distributorId_date_idx" ON "LedgerOrder"("distributorId", "date");

-- CreateIndex
CREATE INDEX "LedgerOrderLine_orderId_idx" ON "LedgerOrderLine"("orderId");

-- CreateIndex
CREATE INDEX "LedgerOrderLine_productId_idx" ON "LedgerOrderLine"("productId");

-- AddForeignKey
ALTER TABLE "LedgerProduct" ADD CONSTRAINT "LedgerProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerPrice" ADD CONSTRAINT "LedgerPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "LedgerProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerPrice" ADD CONSTRAINT "LedgerPrice_changeId_fkey" FOREIGN KEY ("changeId") REFERENCES "LedgerPriceChange"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerDistributor" ADD CONSTRAINT "LedgerDistributor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerOrder" ADD CONSTRAINT "LedgerOrder_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "LedgerDistributor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerOrderLine" ADD CONSTRAINT "LedgerOrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "LedgerOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerOrderLine" ADD CONSTRAINT "LedgerOrderLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "LedgerProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

