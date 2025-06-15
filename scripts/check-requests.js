// check-requests.js
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // First, let's check the requests table structure
    const requestColumns = await prisma.$queryRaw`
      SHOW COLUMNS FROM requests;
    `;
    console.log('Request table columns:');
    console.table(requestColumns);

    // Check if there are any requests
    const requestCount = await prisma.request.count();
    console.log(`\nTotal requests in database: ${requestCount}`);

    // Get the first 5 requests with their branch IDs
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

    // Check the branches table
    const branchCount = await prisma.branches.count();
    console.log(`\nTotal branches in database: ${branchCount}`);

    // Get the first 5 branches
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

    // Check if any requests have branchId that exists in branches
    if (requestCount > 0 && branchCount > 0) {
      const requestsWithBranches = await prisma.$queryRaw`
        SELECT r.id, r.branchId, b.name as branchName, b.client_id
        FROM requests r
        LEFT JOIN branches b ON r.branchId = b.id
        LIMIT 5
      `;
      
      console.log('\nRequests with their branch info:');
      console.table(requestsWithBranches);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();