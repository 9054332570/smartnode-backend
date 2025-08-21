const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema({
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  temperature: {
    type: Number,
    required: true
  },
  humidity: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  
  sunrise: {
    type: Date,
    required: true
  },
  sunset: {
    type: Date,
    required: true
  },
  forecast_date: {
    type: Date,
    required: true
  },
  is_current: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Weather', weatherSchema);