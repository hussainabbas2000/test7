const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { mean } = require('../utils/stats');  // <-- changed here

const DATA_PATH = path.join(__dirname, '../../../data/items.json');

let cachedStats = null;
let lastModifiedTime = null;

// Function to recalculate and cache stats
async function calculateStats() {
  return new Promise((resolve, reject) => {
    fs.readFile(DATA_PATH, (err, raw) => {
      if (err) return reject(err);

      try {
        const items = JSON.parse(raw);

        const stats = {
          total: items.length,
          averagePrice: mean(items.map(item => item.price)),  // Using mean utility here
        };

        cachedStats = stats;
        resolve(stats);
      } catch (parseErr) {
        reject(parseErr);
      }
    });
  });
}

// Middleware: Check file modification before serving cached stats
router.get('/', async (req, res, next) => {
  try {
    const { mtimeMs } = await fs.promises.stat(DATA_PATH);

    if (!cachedStats || mtimeMs !== lastModifiedTime) {
      lastModifiedTime = mtimeMs;
      await calculateStats();
    }

    res.json(cachedStats);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
