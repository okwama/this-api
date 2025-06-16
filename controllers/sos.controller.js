const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new SOS alert
const createSOS = async (req, res) => {
  try {
    const guard_id = req.user.userId;
    const guard_name = req.user.name;
    const { latitude, longitude, sos_type } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const sos = await prisma.sos.create({
      data: {
        guard_id: guard_id,
        guard_name: guard_name,
        sos_type: sos_type || 'sos',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    res.status(201).json({ success: true, sos });
  } catch (error) {
    console.error('Error creating SOS:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all SOS alerts
const getAllSOS = async (req, res) => {
  try {
    const sosList = await prisma.sos.findMany({
      orderBy: { created_at: 'desc' },
    });
    res.status(200).json({ success: true, data: sosList });
  } catch (error) {
    console.error('Error fetching SOS:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createSOS,
  getAllSOS,
};
