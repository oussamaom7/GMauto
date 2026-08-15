import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@vhumaroc.ma";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMoi123!";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Admin";

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash, name: adminName },
  });

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      companyName: "VHU MAROC",
      defaultVatRate: 20.0,
      invoicePrefix: "FAC",
      invoiceNumberPadding: 4,
    },
  });

  await prisma.invoiceCounter.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", lastNumber: 0 },
  });

  const [moteur, carrosserie] = await Promise.all([
    prisma.category.upsert({
      where: { name: "Moteur" },
      update: {},
      create: { name: "Moteur" },
    }),
    prisma.category.upsert({
      where: { name: "Carrosserie" },
      update: {},
      create: { name: "Carrosserie" },
    }),
  ]);

  const [renault, peugeot] = await Promise.all([
    prisma.brand.upsert({
      where: { name: "Renault" },
      update: {},
      create: { name: "Renault" },
    }),
    prisma.brand.upsert({
      where: { name: "Peugeot" },
      update: {},
      create: { name: "Peugeot" },
    }),
  ]);

  const sampleProducts = [
    {
      reference: "REF-1001",
      name: "Plaquette de frein",
      quantity: 20,
      rmb: 10,
      sellingPrice: 25,
      minimumStock: 5,
      categoryId: carrosserie.id,
      brandId: renault.id,
    },
    {
      reference: "REF-1002",
      name: "Alternateur",
      quantity: 20,
      rmb: 16,
      sellingPrice: 40,
      minimumStock: 5,
      categoryId: moteur.id,
      brandId: renault.id,
    },
    {
      reference: "REF-1003",
      name: "Pare-choc avant",
      quantity: 50,
      rmb: 40,
      sellingPrice: 90,
      minimumStock: 10,
      categoryId: carrosserie.id,
      brandId: peugeot.id,
    },
    {
      reference: "REF-1004",
      name: "Turbo",
      quantity: 3,
      rmb: 60,
      sellingPrice: 150,
      minimumStock: 5,
      categoryId: moteur.id,
      brandId: peugeot.id,
    },
    {
      reference: "REF-1005",
      name: "Radiateur",
      quantity: 0,
      rmb: 35,
      sellingPrice: 80,
      minimumStock: 3,
      categoryId: moteur.id,
      brandId: renault.id,
    },
  ];

  for (const product of sampleProducts) {
    await prisma.product.upsert({
      where: { reference: product.reference },
      update: {},
      create: product,
    });
  }

  console.log("Seed terminé.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
