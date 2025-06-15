const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create initial service types
  await prisma.serviceType.createMany({
    data: [
      { name: 'Pick and Drop', status: 0 },
      { name: 'BSS', status: 0 }
    ],
    skipDuplicates: true
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
