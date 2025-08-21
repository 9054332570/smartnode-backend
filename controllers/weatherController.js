const WeatherData = require('../models/WeatherData');
const Location = require('../models/Location');

exports.getWeatherData = async (req, res) => {
  try {
    const { locationId } = req.params;
    
    // Validate location exists
    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    // Get weather data for the location
    const weatherData = await WeatherData.find({ locationId })
      .sort({ date: 1 })
      .limit(5);
    
    res.json(weatherData);
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};