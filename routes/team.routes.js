const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const teamController = require('../controllers/team.controller');

// IMPORTANT: All specific routes (without parameters) must come FIRST
// before any parameterized routes like /:id

// Get my team
router.get('/my-team', auth.authenticate, teamController.getMyTeam);
router.post('/add-new-team-member', auth.authenticate, teamController.addNewTeamMember);
// PARAMETERIZED ROUTES MUST COME LAST
// Get team by ID
router.get('/:id', auth.authenticate, teamController.getTeamById);

module.exports = router;
