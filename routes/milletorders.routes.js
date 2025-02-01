const express = require('express');
const { createOrder, deleteOrderById, deleteAllOrders } = require('../controllers/milletorders.controller'); 

const router = express.Router();
 
router.post('/orders', createOrder);
router.post('/orders/delete/:id', deleteOrderById);
router.post('/orders/delete', deleteAllOrders);

module.exports = router;
