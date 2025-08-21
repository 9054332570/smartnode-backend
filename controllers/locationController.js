const Location = require('../models/Location');
const { updateWeatherDataForLocation } = require('../services/weatherService');

exports.addLocation = async (req, res) => {
  try {
    const { name, latitude, longitude } = req.body;
    
    // Validate input
    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Name, latitude, and longitude are required' });
    }
    
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({ error: 'Latitude must be between -90 and 90' });
    }
    
    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Longitude must be between -180 and 180' });
    }
    
    // Check if location already exists
    const existingLocation = await Location.findOne({ latitude, longitude });
    if (existingLocation) {
      return res.status(409).json({ error: 'Location already exists' });
    }
    
    // Create new location
    const location = new Location({ name, latitude, longitude });
    await location.save();
    
    
exports.getLocations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const locations = await Location.find()  
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Location.countDocuments();  
    const pages = Math.ceil(total / limit);

    res.json({
      data: locations,
      pagination: {
        page,
        limit,
        total,    
        pages,    
        hasNext: page < pages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching locations:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
  } catch (error) {
    console.error('Error adding location:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort({ createdAt: -1 });
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};