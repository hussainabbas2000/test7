const request = require('supertest');
const express = require('express');
const itemsRoute = require('../src/routes/items');
const fs = require('fs').promises;
const path = require('path');

// Mock items.json location
const DATA_PATH = path.join(__dirname, '../../data/testitems.json');

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use('/api/items', itemsRoute);

let testItems = [
  { id: 1, name: 'Apple', price: 1.5, category: 'Fruit' },
  { id: 2, name: 'Banana', price: 1.0, category: 'Fruit' }
];

beforeEach(async () => {
  await fs.writeFile(DATA_PATH, JSON.stringify(testItems, null, 2));
});

describe('GET /api/items', () => {
  it('should return all items', async () => {
    const res = await request(app).get('/api/items');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it('should return filtered items based on query', async () => {
    const res = await request(app).get('/api/items?q=app');
    expect(res.status).toBe(200);
    expect(res.body.items[0].name).toMatch(/apple/i);
  });

  it('should return paginated results', async () => {
    const res = await request(app).get('/api/items?page=1&limit=1');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
    expect(res.body.totalPages).toBe(2);
  });
});

describe('GET /api/items/:id', () => {
  it('should return item by ID', async () => {
    const res = await request(app).get('/api/items/1');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Apple');
  });

  it('should return 404 for non-existent ID', async () => {
    const res = await request(app).get('/api/items/999');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});

describe('POST /api/items', () => {
  it('should create a new item with valid data', async () => {
    const newItem = { name: 'Orange', price: 2.0, category: 'Fruit' };
    const res = await request(app).post('/api/items').send(newItem);
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Orange');
  });

  it('should reject missing name field', async () => {
    const badItem = { price: 2.0, category: 'Fruit' };
    const res = await request(app).post('/api/items').send(badItem);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name.*required/i);
  });

  it('should reject invalid price type', async () => {
    const badItem = { name: 'Orange', price: 'free', category: 'Fruit' };
    const res = await request(app).post('/api/items').send(badItem);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/price.*number/i);
  });

  it('should reject missing category field', async () => {
    const badItem = { name: 'Orange', price: 1.0 };
    const res = await request(app).post('/api/items').send(badItem);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/category/i);
  });
});
