-- CreateEnum
CREATE TYPE "OrderState" AS ENUM ('DRAFT', 'AWAITING_DEPOSIT', 'RESERVED', 'IN_PROGRESS', 'PENDING_INSPECTION', 'COMPLETED', 'COMPLETED_WITH_DAMAGES');

-- CreateEnum
CREATE TYPE "AssetState" AS ENUM ('AVAILABLE', 'RESERVED', 'RENTED', 'IN_INSPECTION', 'IN_MAINTENANCE', 'TOTAL_LOSS');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('MOVEIS', 'DECORACAO', 'LOUÇAS', 'TECIDOS', 'ELETRONICOS', 'GERAL');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductBase" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dailyPrice" DECIMAL(10,2) NOT NULL,
    "category" "ProductCategory" NOT NULL DEFAULT 'GERAL',
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductBase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "productBaseId" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "state" "AssetState" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "state" "OrderState" NOT NULL DEFAULT 'DRAFT',
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "pickUpDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderAsset" (
    "orderId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,

    CONSTRAINT "OrderAsset_pkey" PRIMARY KEY ("orderId","assetId")
);

-- CreateTable
CREATE TABLE "MaintenanceLog" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DECIMAL(10,2),
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_document_key" ON "Customer"("document");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_serialNumber_key" ON "Asset"("serialNumber");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_productBaseId_fkey" FOREIGN KEY ("productBaseId") REFERENCES "ProductBase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAsset" ADD CONSTRAINT "OrderAsset_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAsset" ADD CONSTRAINT "OrderAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceLog" ADD CONSTRAINT "MaintenanceLog_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
