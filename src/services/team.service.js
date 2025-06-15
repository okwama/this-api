const prisma = require('../config/db');

exports.createTeam = async (commanderId, memberIds) => {
  // Verify commander exists and has appropriate role
  const commander = await prisma.staff.findUnique({
    where: { id: commanderId },
    include: { role: true }
  });

  if (!commander || !['COMMANDER', 'SUPERVISOR'].includes(commander.role.name)) {
    throw new Error('Only commanders/supervisors can create teams');
  }

  // Create team memberships
  return prisma.$transaction(
    memberIds.map(memberId => 
      prisma.teamMember.create({
        data: {
          commanderId,
          memberId
        },
        include: {
          member: true
        }
      })
    )
  );
};

exports.getTeamMembers = async (commanderId) => {
  return prisma.teamMember.findMany({
    where: { commanderId },
    include: {
      member: {
        include: {
          role: true
        }
      }
    }
  });
};