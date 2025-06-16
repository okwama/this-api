const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { STAFF_ROLES } = require('../constants');

const generatetoken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      roleId: user.roleId,
      badgeNumber: user.badgeNumber
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
};

exports.registerStaff = async (staffData) => {
  const hashedPassword = await bcrypt.hash(staffData.password, 10);
  
  return prisma.staff.create({
    data: {
      ...staffData,
      password: hashedPassword,
      status: 'ACTIVE'
    },
    select: {
      id: true,
      name: true,
      email: true,
      badgeNumber: true,
      roleId: true
    }
  });
};

exports.loginStaff = async (email, password) => {
  const staff = await prisma.staff.findUnique({
    where: { email },
    include: { role: true }
  });

  if (!staff || !(await bcrypt.compare(password, staff.password))) {
    throw new Error('Invalid credentials');
  }

  if (!staff.isActive) {
    throw new Error('Account deactivated');
  }

  return {
    token: generatetoken(staff),
    staff: {
      id: staff.id,
      name: staff.name,
      role: staff.role.name,
      badgeNumber: staff.badgeNumber
    }
  };
};