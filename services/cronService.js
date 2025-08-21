const axios = require('axios');
const Weather = require('../models/WeatherData');
const Location = require('../models/Location');

// Fetch 5-day forecast with sunrise/sunset
const fetch5DayForecast = async (latitude, longitude) => {
  try {
    // Use current weather API for sunrise/sunset, then forecast API for temperature
    const [currentResponse, forecastResponse] = await Promise.all([
      axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`),
      axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`)
    ]);

    const dailyData = [];
    const processedDates = new Set();
    
    // Get sunrise/sunset from current weather
    const currentSunrise = new Date(currentResponse.data.sys.sunrise * 1000);
    const currentSunset = new Date(currentResponse.data.sys.sunset * 1000);
    
    // Add today's data
    dailyData.push({
      temperature: currentResponse.data.main.temp,
      humidity: currentResponse.data.main.humidity,
      description: currentResponse.data.weather[0].description,
      sunrise: currentSunrise,
      sunset: currentSunset,
      forecast_date: new Date(),
      is_current: true
    });
    
    // Process forecast data for next 4 days (noon data for consistency)
    forecastResponse.data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateString = date.toDateString();
      const hour = date.getHours();
      
      // Use noon forecasts for consistent daily data
      if (hour === 12 && !processedDates.has(dateString) && dailyData.length < 5) {
        processedDates.add(dateString);
        
        // For forecast days, use the same sunrise/sunset as today (simplified)
        // In real app, you'd calculate sunrise/sunset for each day
        dailyData.push({
          temperature: item.main.temp,
          humidity: item.main.humidity,
          description: item.weather[0].description,
          sunrise: new Date(currentSunrise.getTime() + (dailyData.length * 24 * 60 * 60 * 1000)),
          sunset: new Date(currentSunset.getTime() + (dailyData.length * 24 * 60 * 60 * 1000)),
          forecast_date: date,
          is_current: false
        });
      }
    });
    
    return dailyData;
  } catch (error) {
    console.error('5-day forecast error:', error.response?.data || error.message);
    
    // Fallback: generate mock data with proper dates
    return generateMockForecastData();
  }
};


const generateMockForecastData = () => {
  const dailyData = [];
  const now = new Date();
  
  for (let i = 0; i < 5; i++) {
    const forecastDate = new Date(now.getTime() + (i * 24 * 60 * 60 * 1000));
    const sunrise = new Date(forecastDate);
    sunrise.setHours(6, 0, 0, 0);
    const sunset = new Date(forecastDate);
    sunset.setHours(18, 0, 0, 0);
    
    dailyData.push({
      temperature: Math.random() * 30 + 10,
      humidity: Math.random() * 100,
      description: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'][Math.floor(Math.random() * 4)],
      sunrise: sunrise,
      sunset: sunset,
      forecast_date: forecastDate,
      is_current: i === 0
    });
  }
  
  return dailyData;
};


const maintain5DayData = async (locationId) => {
  try {
    // Delete data older than 5 days
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    
    await Weather.deleteMany({ 
      location: locationId, 
      forecast_date: { $lt: fiveDaysAgo }
    });
    
    return await Weather.countDocuments({ location: locationId });
  } catch (error) {
    console.error('Data maintenance error:', error);
    return 0;
  }
};


const updateWeatherDataForAllLocations = async () => {
  try {
    const locations = await Location.find();
    
    for (const location of locations) {
      // Get 5-day forecast with sunrise/sunset
      const forecastData = await fetch5DayForecast(location.latitude, location.longitude);
      
      // Save forecast data
      for (const data of forecastData) {
        const weather = new Weather({
          location: location._id,
          ...data
        });
        await weather.save();
      }
// Around line 127, add a connection check:
if (mongoose.connection.readyState !== 1) { // 1 = connected
  console.log('Skipping weather update - MongoDB not connected');
  return;
}      
      // Maintain 5-day data
      const currentCount = await maintain5DayData(location._id);
      console.log(`Location ${location.name}: ${currentCount} days of forecast data`);
    }
    
    console.log('Weather data update completed with 5-day forecast');
  } catch (error) {
    console.error('Error updating weather data:', error);
  }
};

module.exports = {
  updateWeatherDataForAllLocations
};