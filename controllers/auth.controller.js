const prisma = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prismaClient = new PrismaClient();

// Generate tokens
const generateTokens = async (user, deviceInfo = null, ipAddress = null) => {
  const accessToken = jwt.sign(
    { 
      userId: user.id,
      role: user.role,
      emplNo: user.emplNo,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  // Store token in database
  await prismaClient.token.create({
    data: {
      staffId: user.id,
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
      deviceInfo,
      ipAddress,
    },
  });

  return { accessToken, refreshToken };
};

const login = async (req, res, next) => {
  try {
    // Validate request body
    if (!req.body) {
      console.error('No request body provided');
      return res.status(400).json({ message: 'Request body is required' });
    }

    const { emplNo, password } = req.body;
    
    // Input validation
    if (!emplNo || !password) {
      console.error('Missing required fields', { emplNo: !!emplNo, password: !!password });
      return res.status(400).json({ 
        message: 'Employee number and password are required' 
      });
    }

    // Validate JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    console.log(`Login attempt for employee: ${emplNo}`);
    
    // Find user by employee number
    const user = await prismaClient.staff.findFirst({
      where: { emplNo: emplNo.toString().trim() }
    });

    if (!user) {
      console.warn(`Login failed: No user found with employee number ${emplNo}`);
      return res.status(401).json({ 
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password || '');
    if (!isPasswordValid) {
      console.warn(`Login failed: Invalid password for user ${user.id}`);
      return res.status(401).json({ 
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check user status (1 = active, 0 = inactive)
    if (user.status !== 1) {
      console.warn(`Login failed: Inactive account for user ${user.id}`);
      return res.status(403).json({ 
        message: 'Your account is not active. Please contact an administrator.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Invalidate existing tokens for this user
    await prismaClient.token.updateMany({
      where: { 
        staffId: user.id,
        isValid: true
      },
      data: { isValid: false }
    });

    const { accessToken, refreshToken } = await generateTokens(user);

    // Prepare user data for response
    const userData = {
      id: user.id,
      name: user.name,
      emplNo: user.emplNo,
      role: user.role,
      roleId: user.roleId,
      idNo: user.idNo,
      photoUrl: user.photoUrl || '/default-avatar.png',
      status: user.status,
      teamId: user.team_id // Add team ID for team-based access
    };

    console.log(`Login successful for user: ${user.id} (${user.role})`);
    
    // Send success response
    res.json({ 
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: userData 
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, password, roleId, role, emplNo, idNo } = req.body;

    // Check if employee number exists
    const existingUser = await prismaClient.staff.findFirst({
      where: { emplNo }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Employee number already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new staff with optional fields
    const user = await prismaClient.staff.create({
      data: {
        name,
        phone: phone || null,
        password: hashedPassword,
        roleId: roleId || 0,
        role,
        emplNo,
        idNo,
        photoUrl: 'default.jpg',
        status: 0
      }
    });

    const { accessToken, refreshToken } = await generateTokens(user);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        name: user.name,
        emplNo: user.emplNo,
        role: user.role,
        roleId: user.roleId
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const staff = await prismaClient.staff.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        roleId: true,
        emplNo: true,
        idNo: true,
        photoUrl: true,
        status: true,
        requests: {
          where: {
            createdAt: {
              gte: new Date('1970-01-01') // Filter dates after Unix epoch
            }
          },
          select: {
            id: true,
            userName: true,
            pickupLocation: true,
            deliveryLocation: true,
            status: true,
            myStatus: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      }
    });

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    res.json(staff);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    const updatedUser = await prismaClient.staff.update({
      where: { id: req.user.userId },
      data: {
        name,
        phone
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        emplNo: true,
        photoUrl: true,
        status: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const deviceInfo = req.headers['user-agent'];
    const ipAddress = req.ip;

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Check if token exists and is valid
    const tokenRecord = await prismaClient.token.findFirst({
      where: {
        refreshToken,
        isValid: true,
        expiresAt: { gt: new Date() }
      },
      include: { staff: true }
    });

    if (!tokenRecord) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Invalidate old token
    await prismaClient.token.update({
      where: { id: tokenRecord.id },
      data: { isValid: false }
    });

    // Generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = 
      await generateTokens(tokenRecord.staff, deviceInfo, ipAddress);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      await prismaClient.token.updateMany({
        where: { 
          accessToken: token,
          isValid: true
        },
        data: { isValid: false }
      });
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  refreshToken,
  logout,
};