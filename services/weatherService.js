const axios = require('axios');
const WeatherData = require('../models/WeatherData');
const Location = require('../models/Location');
const moment = require('moment-timezone');

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

async function fetchWeatherData(latitude, longitude) {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=current,minutely,hourly,alerts&appid=${OPENWEATHER_API_KEY}`
    );
    
    return response.data.daily.slice(0, 5); // Get next 5 days
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    throw new Error('Failed to fetch weather data');
  }
}

async function updateWeatherDataForLocation(locationId) {
  try {
    const location = await Location.findById(locationId);
    if (!location) {
      throw new Error('Location not found');
    }
    
    const weatherData = await fetchWeatherData(location.latitude, location.longitude);
    
    // Process and save each day's data
    for (const day of weatherData) {
      const date = new Date(day.dt * 1000);
      const sunrise = new Date(day.sunrise * 1000);
      const sunset = new Date(day.sunset * 1000);
      
      // Check if data already exists for this date
      const existingData = await WeatherData.findOne({
        locationId: location._id,
        date: { $gte: new Date(date.setHours(0, 0, 0, 0)), $lt: new Date(date.setHours(23, 59, 59, 999)) }
      });
      
      if (existingData) {
        // Update existing record
        existingData.sunrise = sunrise;
        existingData.sunset = sunset;
        await existingData.save();
      } else {
        // Create new record
        const newWeatherData = new WeatherData({
          locationId: location._id,
          date,
          sunrise,
          sunset
        });
        await newWeatherData.save();
      }
    }
    
    // Ensure we have exactly 5 days of data
    await maintainFiveDaysData(location._id);
    
    return { success: true, message: 'Weather data updated successfully' };
  } catch (error) {
    console.error('Error updating weather data:', error.message);
    throw error;
  }
}

async function maintainFiveDaysData(locationId) {
  try {
    // Get all weather data for this location, sorted by date
    const allData = await WeatherData.find({ locationId }).sort({ date: 1 });
    
    // If we have more than 5 records, remove the oldest ones
    if (allData.length > 5) {
      const recordsToRemove = allData.slice(0, allData.length - 5);
      for (const record of recordsToRemove) {
        await WeatherData.findByIdAndDelete(record._id);
      }
    }
    
    // If we have less than 5 records, fetch additional data
    if (allData.length < 5) {
      const location = await Location.findById(locationId);
      const latestDate = allData.length > 0 ? 
        new Date(Math.max(...allData.map(d => d.date))) : 
        new Date();
      
      const daysNeeded = 5 - allData.length;
      
      await updateWeatherDataForLocation(locationId);
    }
  } catch (error) {
    console.error('Error maintaining five days data:', error.message);
    throw error;
  }
}

module.exports = {
  fetchWeatherData,
  updateWeatherDataForLocation,
  maintainFiveDaysData
};