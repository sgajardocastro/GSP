const express = require('express');
const router = express.Router();
const storageController = require('../controllers/storageController');

router.post('/upload', storageController.upload);
router.get('/view/:id', storageController.view);
router.get('/download/:id', storageController.download);

module.exports = router;
