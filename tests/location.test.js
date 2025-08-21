const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Location = require('../models/Location');

describe('Location API', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }
  });

  
  beforeEach(async () => {
    // Clear the database before each test
    await Location.deleteMany({});
    
    // Create test locations that will be used in multiple tests
    await Location.create([
      {
        name: 'Delhi',
        latitude: 28.6139,
        longitude: 77.209
      },
      {
        name: 'Bangalore',
        latitude: 12.9716,
        longitude: 77.5946
      }
    ]);
  });

  
  afterAll(async () => {
    await Location.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/locations', () => {
    it('should create a new location with Indian coordinates', async () => {
      const res = await request(app)
        .post('/api/locations')
        .send({
          name: 'Mumbai',
          latitude: 19.0760,
          longitude: 72.8777
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe('Mumbai');
    });

    it('should return error for invalid coordinates', async () => {
      const res = await request(app)
        .post('/api/locations')
        .send({
          name: 'Invalid City',
          latitude: 100,
          longitude: -74.0060
        });
      
      expect(res.statusCode).toEqual(400);
    });
  });

  describe('GET /api/locations', () => {
    it('should get all locations', async () => {
      const res = await request(app).get('/api/locations');
      
      console.log('GET Response:', JSON.stringify(res.body, null, 2));
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2); 
      
      
      const locationNames = res.body.data.map(loc => loc.name);
      expect(locationNames).toContain('Delhi');
      expect(locationNames).toContain('Bangalore');
    });

    it('should return empty array when no locations exist', async () => {
      
      await Location.deleteMany({});
      
      const res = await request(app).get('/api/locations');
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });
  });
});

