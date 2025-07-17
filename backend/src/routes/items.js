const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

// Utility to read data
//ASYNC READ FUNC
async function readData() {
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

//ASYNC WRITE FUNC
async function writeData(data){
  await fs.writeFile(DATA_PATH, JSON.stringify(data,null,2))
}
// GET /api/items
//ASYNC FUNC
router.get('/', async (req, res, next) => {
  try {
    //ASYNC CALL TO READ FUNCTION
    let data = await readData();

    //PAGINATION PARAMS
    const { limit = 10, page = 1, q } = req.query;
    
    if (q) {
      // Simple substring search (sub‑optimal)
      data = data.filter(item => item.name.toLowerCase().includes(q.toLowerCase()));
    }

    //PAGINATION VARIABLES
    const pageNum = Math.max(1,parseInt(page));
    //limit abuse catered
    const limitNum = Math.min(100, Math.max(1,parseInt(limit)));
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = data.slice(startIndex, startIndex + limitNum)

    //RESPONSE HAS PAGINATION INFO
    res.json({
      items: paginatedItems,
      page: pageNum,
      totalPages: Math.ceil(data.length/limitNum)
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
//ASYNC FUNC
router.get('/:id', async (req, res, next) => {
  try {

    //ASYNC CALL TO READ FUNCTION
    const data = await readData();


    let item = data.find(i => i.id === parseInt(req.params.id));
    if (!item) {
      return res.status(404).json({error: 'Item not found'});      
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
//ASYNC FUNC
router.post('/', async (req, res, next) => {
  try {
    
    const item = req.body;


    //Validate payload
    if(!item.name || typeof item.name != 'string'){
      return res.status(400).json({ error: 'Item "name" is required and must be a string.' });
    }

    if (item.price === undefined || typeof item.price !== 'number' || item.price < 0) {
      return res.status(400).json({ error: 'Item "price" is required and must be a non-negative number.' });
    }

    if (!item.category || typeof item.category !== 'string') {
      return res.status(400).json({ error: 'Item must have a category which needs to be a string' });
    }




    //ASYNC CALL TO READ FUNCTION
    const data = await readData();

    
    item.id = Date.now();
    data.push(item);


    //ASYNC CALL TO WRITE FUNCTION
    await writeData(data);


    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;