const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/error');

const authRoutes = require('./routes/auth.routes');
const requestRoutes = require('./routes/request.routes');
const teamRoutes = require('./routes/team.routes');
const locationRoutes = require('./routes/location.routes');
const uploadRoutes = require('./routes/upload.routes');
const sosRoutes = require('./routes/sos.routes');
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Remove morgan logging for serverless environment
// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// }

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/sos', sosRoutes);

app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'API root working' });
});

app.use(errorHandler);

// Export the app for Vercel serverless functions
module.exports = app;