const express = require('express');
const router = express.Router();

// Root endpoint
router.get('/', (req, res) => {
  res.json({ message: 'Greetings API root' });
});

// GET greeting for specific location
router.get('/:location_id', async (req, res) => {
  try {
    const locationId = req.params.location_id;
    res.json({ message: `Greeting for location ${locationId}` });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;