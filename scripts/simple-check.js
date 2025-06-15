const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Check if requests exist
    const requestCount = await prisma.request.count();
    console.log(`Total requests: ${requestCount}`);

    // Get first 5 requests
    const requests = await prisma.request.findMany({
      select: {
        id: true,
        branchId: true,
        pickupLocation: true,
        deliveryLocation: true
      },
      take: 5
    });
    console.log('\nSample requests:');
    console.table(requests);

    // Check if branches exist
    const branchCount = await prisma.branches.count();
    console.log(`\nTotal branches: ${branchCount}`);

    // Get first 5 branches
    const branches = await prisma.branches.findMany({
      select: {
        id: true,
        name: true,
        client_id: true
      },
      take: 5
    });
    console.log('\nSample branches:');
    console.table(branches);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
