const express = require('express');
const app = express();
const teamController = require('../src/controllers/team.controller');
const { authenticate } = require('../src/middleware/auth');

// Get team by ID
app.get('/:id', authenticate, teamController.getTeamById);

// Get my team
app.get('/my-team', authenticate, teamController.getMyTeam);

// Add new team member
app.post('/add-member', authenticate, teamController.addNewTeamMember);

// Export the handler for serverless functions
module.exports = (req, res) => {
  // Set up the request and response objects for Express
  req.url = req.url.replace(/^\/api\/team/, '');
  app(req, res);
}; 