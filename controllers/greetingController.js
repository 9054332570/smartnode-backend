const moment = require('moment-timezone');
const Location = require('../models/Location');

exports.getGreeting = async (req, res) => {
  try {
    const { locationId } = req.params;
    
    // Validate location exists
    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    // Get current time at location
    let currentTime;
    try {
      if (location.timezone) {
        currentTime = moment().tz(location.timezone);
      } else {
        // Estimate timezone from coordinates (simplified approach)
        const offset = location.longitude / 15; // Rough timezone estimation
        currentTime = moment().utcOffset(offset * 60);
      }
    } catch (error) {
      // Fallback to server time if timezone detection fails
      currentTime = moment();
    }
    
    // Determine greeting based on time of day
    const hour = currentTime.hour();
    let greeting;
    
    if (hour >= 5 && hour < 12) {
      greeting = 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      greeting = 'Good afternoon';
    } else if (hour >= 17 && hour < 21) {
      greeting = 'Good evening';
    } else {
      greeting = 'Good night';
    }
    
    res.json({
      greeting,
      currentTime: currentTime.format('YYYY-MM-DD HH:mm:ss'),
      location: location.name
    });
  } catch (error) {
    console.error('Error generating greeting:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};