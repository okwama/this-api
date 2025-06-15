const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getTeamById = async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    
    if (isNaN(teamId)) {
      return res.status(400).json({ 
        message: 'Invalid team ID. Please provide a valid number.' 
      });
    }

    const team = await prisma.teams.findUnique({
      where: { id: teamId },
      include: {
        team_members: {
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                role: true,
                emplNo: true,
                photoUrl: true,
              }
            }
          }
        }
      }
    });
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    res.status(200).json({ team });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getMyTeam = async (req, res) => {
  try {
    const staffId = parseInt(req.user.userId);
    console.log('[getMyTeam] staffId:', staffId);
    if (!staffId || isNaN(staffId)) {
      console.log('[getMyTeam] Invalid staff ID');
      return res.status(400).json({ message: 'Invalid staff ID' });
    }

    const today = new Date();
    const latestMembership = await prisma.team_members.findFirst({
      where: {
        staff_id: staffId,
        created_at: { lte: today }
      },
      orderBy: { created_at: 'desc' }
    });
    console.log('[getMyTeam] latestMembership:', latestMembership);

    if (!latestMembership) {
      console.log('[getMyTeam] No team found for user');
      return res.status(200).json({ assignedStaff: [], message: 'No team found for today' });
    }

    const teamMembers = await prisma.team_members.findMany({
      where: {
        team_id: latestMembership.team_id,
        created_at: { lte: today }
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
            emplNo: true,
            photoUrl: true,
          }
        },
        teams: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    console.log('[getMyTeam] teamMembers:', teamMembers);

    const assignedStaff = teamMembers.map(member => ({
      ...member.staff,
      teamName: member.teams.name,
      assignedAt: member.created_at
    }));
    console.log('[getMyTeam] assignedStaff:', assignedStaff);

    res.status(200).json({ assignedStaff });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
const addNewTeamMember = async (req, res) => {
  try {
    const { staffId, teamId } = req.body;
    const newTeamMember = await prisma.team_members.create({
      data: {
        staff_id: staffId,
        team_id: teamId,
        created_at: new Date()
      }
    });
    res.status(200).json({ message: 'New team member assigned successfully', newTeamMember });
    const teamMembers = await prisma.team_members.findMany({
      where: {
        team_id: teamId,
        created_at: { lte: today }
      }
    });
    res.status(200).json({ teamMembers });
  } catch (error) {
    console.error('Error assigning new team member:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
module.exports = {
  getMyTeam,
  getTeamById,
  addNewTeamMember
};
