-- CreateEnum
CREATE TYPE "ProductSide" AS ENUM ('GAUCHE', 'DROIT');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "side" "ProductSide";
