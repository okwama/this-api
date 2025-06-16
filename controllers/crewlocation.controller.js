const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/locations
const createLocation = async (req, res) => {
  try {
    const staffId = req.user?.userId;
    const { requestId, latitude, longitude } = req.body;

    console.log('Authenticated staffId:', staffId);
    console.log('Received location update:', { requestId, staffId, latitude, longitude });

    // Validate staff ID
    if (!staffId || isNaN(staffId)) {
      console.error('❌ Invalid or missing staff ID');
      return res.status(401).json({ error: 'Invalid or missing staff ID from authentication' });
    }

    // Validate request body
    if (!requestId || latitude === undefined || longitude === undefined) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ error: 'Missing requestId, latitude, or longitude' });
    }

    const numericRequestId = Number(requestId);

    // Check request existence and status
    const existingRequest = await prisma.request.findUnique({
      where: { id: numericRequestId },
      select: { myStatus: true }
    });

    if (!existingRequest) {
      console.error(`❌ Request not found: ID ${numericRequestId}`);
      return res.status(404).json({ error: 'Request not found' });
    }

    if (existingRequest.myStatus !== 2) {
      console.warn(`🚫 Location update rejected: request.myStatus = ${existingRequest.myStatus}`);
      return res.status(403).json({ error: 'Location updates are only accepted for requests in progress (myStatus = 2)' });
    }

    // Store location
    const location = await prisma.crewLocation.create({
      data: {
        requestId: numericRequestId,
        staffId: Number(staffId),
        latitude,
        longitude
      }
    });
    console.log('✅ Location stored:', location);

    // Update request with latest location coordinates
    const updatedRequest = await prisma.request.update({
      where: { id: numericRequestId },
      data: {
        latitude: latitude,
        longitude: longitude
      },
      select: { myStatus: true }
    });

    console.log('🔄 Updated request with latest location:', {
      myStatus: updatedRequest.myStatus
    });

    return res.status(201).json({
      location,
      myStatus: updatedRequest.myStatus
    });

  } catch (err) {
    console.error('❌ Location error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


// GET /api/locations/:requestId
 const getLocationsByRequest = async (req, res) => {
  const { requestId } = req.params;

  try {
    const locations = await prisma.crewLocation.findMany({
      where: { requestId: Number(requestId) },
      orderBy: { capturedAt: 'asc' }
    });

    res.status(200).json(locations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch locations' });
  }
};
module.exports = {
  createLocation,
  getLocationsByRequest,
  
};