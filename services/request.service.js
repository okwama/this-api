const prisma = require('../config/db');
const { RequestStatus } = require('../constants');

exports.createRequest = async (requestData) => {
  // Generate reference number (e.g., CIT-2023-0001)
  const lastRequest = await prisma.request.findFirst({
    orderBy: { id: 'desc' }
  });
  
  const nextId = lastRequest ? lastRequest.id + 1 : 1;
  const referenceNumber = `CIT-${new Date().getFullYear()}-${nextId.toString().padStart(4, '0')}`;

  return prisma.request.create({
    data: {
      ...requestData,
      referenceNumber,
      status: 'PENDING'
    },
    include: {
      client: true,
      serviceType: true,
      pickupLocation: true,
      dropoffLocation: true
    }
  });
};

exports.assignRequest = async (requestId, staffId) => {
  return prisma.request.update({
    where: { id: requestId },
    data: {
      assignedToId: staffId,
      status: 'ASSIGNED'
    },
    include: {
      assignedTo: true
    }
  });
};

exports.updateRequestStatus = async (requestId, status) => {
  const validTransitions = {
    PENDING: ['ASSIGNED', 'CANCELLED'],
    ASSIGNED: ['IN_TRANSIT', 'CANCELLED'],
    IN_TRANSIT: ['COMPLETED']
  };

  const request = await prisma.request.findUnique({
    where: { id: requestId }
  });

  if (!validTransitions[request.status]?.includes(status)) {
    throw new Error(`Invalid status transition from ${request.status} to ${status}`);
  }

  return prisma.request.update({
    where: { id: requestId },
    data: { status },
    include: {
      client: true,
      assignedTo: true
    }
  });
};

exports.recordCashDenominations = async (requestId, denominations) => {
  // First delete existing denominations for this request
  await prisma.cashDenomination.deleteMany({
    where: { requestId }
  });

  // Create new denominations
  return prisma.cashDenomination.createMany({
    data: denominations.map(d => ({
      requestId,
      denomination: d.denomination,
      count: d.count
    }))
  });
};