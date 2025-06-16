const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token exists and is valid in database
    const tokenRecord = await prisma.token.findFirst({
      where: {
        accessToken: token,
        isValid: true,
        expiresAt: { gt: new Date() }
      },
      include: { staff: true }
    });

    if (!tokenRecord) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Check if user exists and is active
    const user = tokenRecord.staff;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check user status (1 = active, 0 = inactive)
    if (user.status !== 1) {
      return res.status(403).json({ 
        message: 'Your account is not active. Please contact an administrator.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Update last used timestamp
    await prisma.token.update({
      where: { id: tokenRecord.id },
      data: { lastUsedAt: new Date() }
    });

    // Attach user info to request
    req.user = {
      userId: user.id,
      role: user.role,
      emplNo: user.emplNo,
      name: user.name,
      teamId: user.team_id // Add team ID for team-based access
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'You do not have permission to perform this action' 
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorizeRoles
};