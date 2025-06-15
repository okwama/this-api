const prisma = require('../config/db');
const { notifyControlRoom } = require('../utils/notifications');

exports.triggerSOS = async (userId, requestId, coordinates) => {
  const sos = await prisma.sOS.create({
    data: {
      userId,
      requestId: requestId || null,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      status: 'ACTIVE'
    },
    include: {
      user: true,
      request: true
    }
  });

  // Notify control room and nearby staff
  await notifyControlRoom(sos);

  return sos;
};

exports.resolveSOS = async (sosId) => {
  return prisma.sOS.update({
    where: { id: sosId },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date()
    }
  });
};