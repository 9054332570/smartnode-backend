const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Location = require('../models/Location');
const WeatherData = require('../models/WeatherData'); 

describe('Weather API Tests', () => {
  let location;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }
  });

  beforeEach(async () => {
    await Location.deleteMany({});
    await WeatherData.deleteMany({});
    
    location = await Location.create({
      name: 'Bangalore',
      latitude: 12.9716,
      longitude: 77.5946
    });

    // Create mock weather data with CORRECT Date objects
    const now = new Date();
    const sunriseTime = new Date(now);
    sunriseTime.setHours(6, 15, 0, 0); // 6:15 AM
    
    const sunsetTime = new Date(now);
    sunsetTime.setHours(18, 30, 0, 0); // 6:30 PM

    await WeatherData.create({
      location: location._id,
      temperature: 28,
      humidity: 65,
      description: 'Partly Cloudy',
      sunrise: sunriseTime, 
      sunset: sunsetTime,   
      forecast_date: now,   
      is_current: true
    });
  });

  afterAll(async () => {
    await Location.deleteMany({});
    await WeatherData.deleteMany({});
    await mongoose.connection.close();
  });

  it('should return sunrise/sunset forecast for Indian location', async () => {
    const response = await request(app)
      .get(`/api/weather/${location._id}/sunrise-sunset`)
      .expect(200);

    expect(response.body.forecast).toBeDefined();
    expect(Array.isArray(response.body.forecast)).toBe(true);
    expect(response.body.forecast.length).toBeGreaterThan(0);
  });

  
  it('debug - check API response format', async () => {
    const response = await request(app)
      .get(`/api/weather/${location._id}/sunrise-sunset`);
    
    console.log('Sunrise-Sunset Response:', JSON.stringify(response.body, null, 2));
    expect(response.status).toBe(200);
  });
});


afterAll(async () => {
  await mongoose.connection.close();
});