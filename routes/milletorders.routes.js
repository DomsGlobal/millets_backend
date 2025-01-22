const express = require('express');
const { createOrder } = require('../controllers/milletorders.controller'); 

const router = express.Router();
 
router.post('/orders', createOrder);

module.exports = router;
