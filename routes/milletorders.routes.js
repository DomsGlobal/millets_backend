const express = require('express');
const { createOrder, deleteOrderById, deleteAllOrders, contactForm } = require('../controllers/milletorders.controller'); 

const router = express.Router();
 
router.post('/orders', createOrder);
router.post('/orders/delete/:id', deleteOrderById);
router.post('/orders/delete', deleteAllOrders);
router.post('/contact', contactForm);

module.exports = router;
