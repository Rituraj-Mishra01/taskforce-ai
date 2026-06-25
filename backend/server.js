const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Enable CORS for frontend integration
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/leaderboard', require('./routes/leaderboard'));

// Serve built static frontend files in production
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Handle SPA wildcard routing
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.resolve(frontendDistPath, 'index.html'), (err) => {
    if (err) {
      // In development when Vite is running separately, the dist folder might not exist yet
      res.status(404).send('Static frontend build files not found. Run npm run build in /frontend first.');
    }
  });
});

// Fallback for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API Route not found' });
});

// Server Configuration
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskforce-ai';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
