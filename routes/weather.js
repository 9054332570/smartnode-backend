const express = require('express');
const router = express.Router();
const Weather = require('../models/WeatherData');
const Location = require('../models/Location');

// GET weather data for all locations
router.get('/', async (req, res) => {
  try {
    const weatherData = await Weather.find().populate('location');
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// GET weather history for a specific location
router.get('/location/:location_id/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 24;
    const hours = parseInt(req.query.hours) || 24;

    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    const weatherHistory = await Weather.find({ 
      location: req.params.location_id,
      timestamp: { $gte: startDate }
    })
    .populate('location')
    .sort({ timestamp: -1 })
    .limit(limit);
    
    res.json(weatherHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// GET weather data for specific location
router.get('/:location_id', async (req, res) => {
  try {
    const weatherData = await Weather.findOne({ 
      location: req.params.location_id 
    }).populate('location');
    
    if (!weatherData) {
      return res.status(404).json({ error: 'Weather data not found' });
    }
    
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ ADD THIS NEW ENDPOINT:
// GET sunrise/sunset data for specific location (both current and forecast)
router.get('/:location_id/sunrise-sunset', async (req, res) => {
  try {
    const sunriseSunsetData = await Weather.find({
      location: req.params.location_id,
      $or: [
        { is_current: true },  // Include current weather
        { 
          is_current: false,   // Include forecasts
          forecast_date: { $gte: new Date() }
        }
      ]
    })
    .select('sunrise sunset forecast_date temperature description is_current')
    .sort({ forecast_date: 1 })
    .limit(6);  // Current + 5 forecasts
    
    if (!sunriseSunsetData.length) {
      return res.status(404).json({ error: 'No sunrise/sunset data found' });
    }
    
    res.json({
      location: req.params.location_id,
      forecast: sunriseSunsetData,
      days_count: sunriseSunsetData.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;