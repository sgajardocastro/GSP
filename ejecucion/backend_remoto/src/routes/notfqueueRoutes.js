const express = require('express');
const router = express.Router();
const createNotfqueue = require('../controllers/notfqueueController');

router.post('/', createNotfqueue.createNotfqueue);
router.put('/updNotfqueue', createNotfqueue.putNotfqueueEstado);

module.exports = router;
