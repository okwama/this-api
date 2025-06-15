const app = require('./src/app');
const prisma = require('./src/config/db');

// Remove server creation and listening logic
// const http = require('http');
// const PORT = process.env.PORT || 5000;
// const server = http.createServer(app);
// server.listen(PORT, async () => {
//   console.log(`Server running on port ${PORT}`);
//   try {
//     await prisma.$connect();
//     console.log('Database connected');
//   } catch (error) {
//     console.error('Database connection error:', error);
//     process.exit(1);
//   }
// });

// Export the app for Vercel serverless functions
module.exports = app; 