const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
require('dotenv').config();

const locationRoutes = require('./routes/locations');
const weatherRoutes = require('./routes/weather');
const greetingRoutes = require('./routes/greetings');

const { updateWeatherDataForAllLocations } = require('./services/cronService');
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Please try again after 15 minutes'
  }
});

app.use(limiter);
// Routes
app.use('/api/locations', locationRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/greetings', greetingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  
  // Start server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Schedule weather data updates every 24 hours
    cron.schedule('0 0 * * *', () => {
      console.log('Running scheduled weather data update');
      updateWeatherDataForAllLocations();
    });
    
    // Run initial update
    updateWeatherDataForAllLocations();
  });
})
.catch(err => {
  console.error('Database connection error:', err);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler for undefined routes - CORRECT VERSION
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `The route ${req.originalUrl} does not exist` 
  });
});

module.exports = app;