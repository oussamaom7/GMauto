-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('MAD', 'EUR', 'USD', 'CNY');

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'MAD',
ADD COLUMN     "exchangeRate" DECIMAL(10,4) NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "rmbCurrency" "Currency" NOT NULL DEFAULT 'MAD',
ALTER COLUMN "rmb" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "cnyToMad" DECIMAL(10,4) NOT NULL DEFAULT 1.40,
ADD COLUMN     "eurToMad" DECIMAL(10,4) NOT NULL DEFAULT 10.80,
ADD COLUMN     "usdToMad" DECIMAL(10,4) NOT NULL DEFAULT 10.00;
